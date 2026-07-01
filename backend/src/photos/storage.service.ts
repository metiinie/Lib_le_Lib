/**
 * StorageService
 *
 * Wraps two S3-compatible clients:
 *  - PHOTO bucket  → Cloudflare R2  (zero egress, used for profile/chat photos)
 *  - VERIFICATION bucket → AWS S3   (SSE-KMS + Object Lock, used in Phase 3)
 *
 * Both share the same @aws-sdk/client-s3 + @aws-sdk/s3-request-presigner
 * implementation; only the endpoint, region, and credentials differ (env vars).
 *
 * Justification for dependency: @aws-sdk/client-s3 is the only way to generate
 * short-lived presigned PutObject / GetObject URLs that keep raw storage keys
 * off the wire to the client — required by constraints.md §Photos & chat.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly photoClient: S3Client;
  private readonly photoBucket: string;
  private readonly photoTtl: number;

  constructor(private readonly config: ConfigService) {
    this.photoClient = new S3Client({
      endpoint: config.get<string>('PHOTO_BUCKET_ENDPOINT'),
      region: config.get<string>('PHOTO_BUCKET_REGION', 'auto'),
      credentials: {
        accessKeyId: config.get<string>('PHOTO_BUCKET_ACCESS_KEY_ID', ''),
        secretAccessKey: config.get<string>(
          'PHOTO_BUCKET_SECRET_ACCESS_KEY',
          '',
        ),
      },
      // Required for Cloudflare R2 path-style URLs
      forcePathStyle: false,
    });
    this.photoBucket = config.get<string>(
      'PHOTO_BUCKET_NAME',
      'lib-le-lib-photos',
    );
    this.photoTtl = config.get<number>('PHOTO_PRESIGN_TTL_SECONDS', 900);
  }

  /**
   * Returns a short-lived signed PUT URL for the client to upload directly.
   * The backend never touches the raw bytes — only the storage key is stored.
   */
  async getPhotoUploadUrl(
    storageRef: string,
    contentType = 'image/jpeg',
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.photoBucket,
      Key: storageRef,
      ContentType: contentType,
    });
    return getSignedUrl(this.photoClient, command, {
      expiresIn: this.photoTtl,
    });
  }

  /**
   * Returns a short-lived signed GET URL for reading a photo object.
   * Called with the blurred or original key depending on reveal-grant state.
   * Constraints.md: "A photo is never sent unblurred to a client unless an
   * active, non-revoked photo_reveal_grants row exists for that exact viewer."
   */
  async getPhotoReadUrl(storageRef: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.photoBucket,
      Key: storageRef,
    });
    return getSignedUrl(this.photoClient, command, {
      expiresIn: this.photoTtl,
    });
  }
}

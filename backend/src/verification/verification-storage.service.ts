/**
 * VerificationStorageService
 *
 * Wraps AWS S3 client specifically for the isolated verification bucket.
 * Uses SSE-KMS + Object Lock (configured at the bucket level).
 *
 * Strict separation from the public photos bucket is a core privacy constraint.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class VerificationStorageService {
  private readonly logger = new Logger(VerificationStorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly presignTtl: number;

  constructor(private readonly config: ConfigService) {
    this.s3Client = new S3Client({
      endpoint: config.get<string>('VERIFICATION_S3_BUCKET_ENDPOINT'), // Optional if using default AWS endpoints
      region: config.get<string>('VERIFICATION_AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: config.get<string>('VERIFICATION_AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: config.get<string>(
          'VERIFICATION_AWS_SECRET_ACCESS_KEY',
          '',
        ),
      },
      forcePathStyle: false,
    });
    this.bucketName = config.get<string>(
      'VERIFICATION_S3_BUCKET',
      'lib-le-lib-verification',
    );
    this.presignTtl = config.get<number>(
      'VERIFICATION_PRESIGN_TTL_SECONDS',
      900,
    ); // 15 mins max
  }

  /**
   * Returns a short-lived signed PUT URL for the client to upload a document directly.
   */
  async getDocumentUploadUrl(
    storageRef: string,
    contentType = 'application/pdf',
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: storageRef,
      ContentType: contentType,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: this.presignTtl });
  }

  /**
   * Returns a short-lived signed GET URL for reading a document.
   * Only called by the controller when accessed by a verification_officer.
   */
  async getDocumentReadUrl(storageRef: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: storageRef,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: this.presignTtl });
  }

  /**
   * Deletes a document from S3. Called by the retention purge cron job.
   */
  async deleteDocument(storageRef: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: storageRef,
      });
      await this.s3Client.send(command);
    } catch (error) {
      this.logger.error(
        `Failed to delete document ${storageRef} from S3`,
        error,
      );
      throw error;
    }
  }
}

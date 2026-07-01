import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PhotosRepository } from './repositories/photos.repository';
import { StorageService } from './storage.service';
import { RegisterPhotoDto, GrantRevealDto } from './dto/photos.dto';

@Injectable()
export class PhotosService {
  constructor(
    private readonly photosRepository: PhotosRepository,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Generates a short-lived presigned PUT URL.
   * The storage_ref follows the pattern:
   *   photos/<userId>/<uuid>_original.<ext>
   *   photos/<userId>/<uuid>_blurred.<ext>
   * The client uploads BOTH variants. The backend never touches the raw bytes.
   */
  async getUploadUrl(
    userId: string,
    contentType = 'image/jpeg',
  ): Promise<{ uploadUrl: string; storageRef: string }> {
    const ext = contentType.split('/')[1] || 'jpg';
    const key = uuidv4();
    // Original key — this is the unblurred version
    const storageRef = `photos/${userId}/${key}_original.${ext}`;
    const uploadUrl = await this.storageService.getPhotoUploadUrl(
      storageRef,
      contentType,
    );
    return { uploadUrl, storageRef };
  }

  /**
   * Registers a photo row after the client has confirmed the upload is complete.
   * The storage_ref supplied here must be the key the client received from
   * getUploadUrl — we trust the client to upload both _original and _blurred.
   */
  async registerPhoto(userId: string, dto: RegisterPhotoDto) {
    return this.photosRepository.savePhoto({
      profileId: userId,
      storageRef: dto.storageRef,
      position: dto.position ?? 0,
      isPrimary: dto.isPrimary ?? false,
      blurredDefault: true, // always blurred by default (constraints.md)
    });
  }

  /**
   * Resolves blur/reveal for a photo.
   *
   * Rule (constraints.md §Photos & chat):
   * "A photo is never sent unblurred to a client unless an active, non-revoked
   *  photo_reveal_grants row exists for that exact viewer."
   *
   * Returns a signed URL to:
   *   - the _blurred variant  if no active grant exists
   *   - the _original variant if an active grant exists
   *
   * The storage key itself is never leaked — only a short-lived signed URL.
   */
  async getPhotoUrl(
    photoId: string,
    viewerUserId: string,
  ): Promise<{ url: string; blurred: boolean }> {
    const photo = await this.photosRepository.findPhotoById(photoId);
    if (!photo) {
      throw new NotFoundException({
        error: { code: 'PHOTO_NOT_FOUND', message: 'Photo not found.' },
      });
    }

    const grant = await this.photosRepository.findActiveGrant(
      photoId,
      viewerUserId,
    );
    const isOwner = photo.profileId === viewerUserId;

    let storageRef: string;
    let blurred: boolean;

    if (isOwner || grant) {
      // Owner always sees original; grantee sees original
      storageRef = photo.storageRef; // e.g. photos/<uid>/<key>_original.jpg
      blurred = false;
    } else {
      // Swap _original for _blurred in the key
      storageRef = photo.storageRef.replace('_original', '_blurred');
      blurred = true;
    }

    const url = await this.storageService.getPhotoReadUrl(storageRef);
    return { url, blurred };
  }

  /**
   * Grants reveal access to a viewer.
   * Ownership check: only the photo's profile owner may grant.
   */
  async grantReveal(photoId: string, ownerId: string, dto: GrantRevealDto) {
    const photo = await this.photosRepository.findPhotoById(photoId);
    if (!photo) {
      throw new NotFoundException({
        error: { code: 'PHOTO_NOT_FOUND', message: 'Photo not found.' },
      });
    }
    if (photo.profileId !== ownerId) {
      throw new ForbiddenException({
        error: {
          code: 'NOT_PHOTO_OWNER',
          message: 'Only the photo owner can grant reveals.',
        },
      });
    }
    const existing = await this.photosRepository.findActiveGrant(
      photoId,
      dto.viewerUserId,
    );
    if (existing) {
      throw new ConflictException({
        error: {
          code: 'GRANT_EXISTS',
          message: 'Reveal grant already exists.',
        },
      });
    }
    return this.photosRepository.createGrant(photoId, dto.viewerUserId);
  }

  /**
   * Revokes a reveal grant.
   * Ownership check: only the photo's profile owner may revoke.
   */
  async revokeReveal(
    photoId: string,
    ownerId: string,
    viewerUserId: string,
  ): Promise<void> {
    const photo = await this.photosRepository.findPhotoById(photoId);
    if (!photo) {
      throw new NotFoundException({
        error: { code: 'PHOTO_NOT_FOUND', message: 'Photo not found.' },
      });
    }
    if (photo.profileId !== ownerId) {
      throw new ForbiddenException({
        error: {
          code: 'NOT_PHOTO_OWNER',
          message: 'Only the photo owner can revoke reveals.',
        },
      });
    }
    await this.photosRepository.revokeGrant(photoId, viewerUserId);
  }
}

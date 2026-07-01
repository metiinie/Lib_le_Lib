import { Injectable } from '@nestjs/common';
import { DataSource, Repository, IsNull } from 'typeorm';
import { Photo } from '../entities/photo.entity';
import { PhotoRevealGrant } from '../entities/photo-reveal-grant.entity';

@Injectable()
export class PhotosRepository {
  private readonly photoRepo: Repository<Photo>;
  private readonly grantRepo: Repository<PhotoRevealGrant>;

  constructor(private readonly dataSource: DataSource) {
    this.photoRepo = this.dataSource.getRepository(Photo);
    this.grantRepo = this.dataSource.getRepository(PhotoRevealGrant);
  }

  async findPhotoById(photoId: string): Promise<Photo | null> {
    return this.photoRepo.findOne({ where: { id: photoId } });
  }

  async savePhoto(data: Partial<Photo>): Promise<Photo> {
    const entity = this.photoRepo.create(data);
    return this.photoRepo.save(entity);
  }

  async findActiveGrant(
    photoId: string,
    viewerId: string,
  ): Promise<PhotoRevealGrant | null> {
    return this.grantRepo.findOne({
      where: {
        photoId,
        grantedToUserId: viewerId,
        revokedAt: IsNull(),
      },
    });
  }

  async createGrant(
    photoId: string,
    viewerId: string,
  ): Promise<PhotoRevealGrant> {
    const grant = this.grantRepo.create({
      photoId,
      grantedToUserId: viewerId,
    });
    return this.grantRepo.save(grant);
  }

  async revokeGrant(photoId: string, viewerId: string): Promise<void> {
    await this.grantRepo.update(
      { photoId, grantedToUserId: viewerId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }
}

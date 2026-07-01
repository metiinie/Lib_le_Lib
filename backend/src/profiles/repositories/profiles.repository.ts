import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Profile } from '../entities/profile.entity';
import { Region } from '../entities/region.entity';
import { InterestTag } from '../entities/interest-tag.entity';

@Injectable()
export class ProfilesRepository {
  private readonly profileRepo: Repository<Profile>;
  private readonly regionRepo: Repository<Region>;
  private readonly tagRepo: Repository<InterestTag>;

  constructor(private readonly dataSource: DataSource) {
    this.profileRepo = this.dataSource.getRepository(Profile);
    this.regionRepo = this.dataSource.getRepository(Region);
    this.tagRepo = this.dataSource.getRepository(InterestTag);
  }

  async findByUserId(userId: string): Promise<Profile | null> {
    return this.profileRepo.findOne({
      where: { userId },
      relations: ['region', 'interestTags'],
    });
  }

  async saveProfile(data: Partial<Profile>): Promise<Profile> {
    // Must use create() first so TypeORM correctly sets the PrimaryColumn (user_id)
    // on INSERT rather than letting it default to null.
    const entity = this.profileRepo.create(data);
    return this.profileRepo.save(entity);
  }

  async findAllRegions(): Promise<Region[]> {
    return this.regionRepo.find();
  }

  async findAllInterestTags(): Promise<InterestTag[]> {
    return this.tagRepo.find();
  }

  async findTagsByIds(tagIds: string[]): Promise<InterestTag[]> {
    if (!tagIds || tagIds.length === 0) return [];
    return this.tagRepo
      .createQueryBuilder('tag')
      .where('tag.id IN (:...tagIds)', { tagIds })
      .getMany();
  }
}

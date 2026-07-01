import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DiscoveryFiltersDto } from '../dto/discovery-filters.dto';

@Injectable()
export class DiscoveryRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findDiscoverablePaged(
    userId: string,
    excludedIds: string[],
    filters: DiscoveryFiltersDto,
  ): Promise<any[]> {
    const qb = this.dataSource
      .createQueryBuilder()
      .select([
        'p.user_id as "userId"',
        'p.nickname as "nickname"',
        'p.date_of_birth as "dateOfBirth"',
        'p.gender as "gender"',
        'p.bio as "bio"',
        'ph.storage_ref as "primaryPhotoRef"',
        'ph.blurred_default as "isBlurred"',
      ])
      .from('profiles', 'p')
      .innerJoin('users', 'u', 'u.id = p.user_id')
      .leftJoin(
        'photos',
        'ph',
        'ph.profile_id = p.user_id AND ph.is_primary = true',
      )
      .where('u.status = :status', { status: 'active' });

    if (excludedIds.length > 0) {
      qb.andWhere('p.user_id NOT IN (:...excludedIds)', { excludedIds });
    }

    if (filters.minAge) {
      const maxDob = new Date();
      maxDob.setFullYear(maxDob.getFullYear() - filters.minAge);
      qb.andWhere('p.date_of_birth <= :maxDob', {
        maxDob: maxDob.toISOString().split('T')[0],
      });
    }

    if (filters.maxAge) {
      const minDob = new Date();
      minDob.setFullYear(minDob.getFullYear() - filters.maxAge - 1);
      qb.andWhere('p.date_of_birth > :minDob', {
        minDob: minDob.toISOString().split('T')[0],
      });
    }

    if (filters.gender) {
      qb.andWhere('p.gender = :gender', { gender: filters.gender });
    }

    if (filters.regionId) {
      qb.andWhere('p.region_id = :regionId', { regionId: filters.regionId });
    }

    if (filters.relationshipGoals && filters.relationshipGoals.length > 0) {
      qb.andWhere(
        'p.relationship_goals && ARRAY[:...relationshipGoals]::relationship_goal[]',
        {
          relationshipGoals: filters.relationshipGoals,
        },
      );
    }

    // Sort by newest users first for now
    qb.orderBy('u.created_at', 'DESC');
    qb.limit(20);

    return qb.getRawMany();
  }
}

import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DiscoveryFiltersDto } from '../dto/discovery-filters.dto';

@Injectable()
export class DiscoveryRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findDiscoverablePaged(
    userId: string,
    viewerRegionId: string | null,
    viewerGoals: string[] | null,
    viewerGender: string,
    viewerLookingFor: string,
    excludedIds: string[],
    filters: DiscoveryFiltersDto,
  ): Promise<any[]> {
    const qb = this.dataSource
      .createQueryBuilder()
      .select([
        'p.user_id as "id"',
        'p.user_id as "userId"',
        'p.nickname as "nickname"',
        'p.date_of_birth as "dateOfBirth"',
        'p.gender as "gender"',
        'p.bio as "bio"',
        'p.relationship_goals as "relationshipGoals"',
        'r.name as "region"',
        'ph.storage_ref as "primaryPhotoRef"',
        'ph.blurred_default as "isBlurred"',
        'p.photos_visible_to_verified as "photosVisibleToVerified"',
      ])
      .from('profiles', 'p')
      .innerJoin('users', 'u', 'u.id = p.user_id')
      .leftJoin('regions', 'r', 'r.id = p.region_id')
      .leftJoin(
        'photos',
        'ph',
        'ph.profile_id = p.user_id AND ph.is_primary = true',
      )
      // Priority 1: Check if they already liked the viewer
      .leftJoin(
        'swipes',
        'inc_sw',
        'inc_sw.actor_id = p.user_id AND inc_sw.target_id = :userId AND inc_sw.action = \'like\'',
        { userId }
      )
      .addSelect('CASE WHEN inc_sw.id IS NOT NULL THEN 1 ELSE 0 END', 'incomingLike')
      // Priority 3: Region match
      .addSelect(
        viewerRegionId ? 'CASE WHEN p.region_id = :viewerRegionId THEN 1 ELSE 0 END' : '0', 
        'sameRegion'
      )
      .setParameter('viewerRegionId', viewerRegionId)
      .where('u.status = :status', { status: 'active' });

    if (excludedIds.length > 0) {
      qb.andWhere('p.user_id NOT IN (:...excludedIds)', { excludedIds });
    }

    // Bidirectional Looking For filter
    if (viewerLookingFor === 'men') {
      qb.andWhere('p.gender = :reqGender', { reqGender: 'man' });
    } else if (viewerLookingFor === 'women') {
      qb.andWhere('p.gender = :reqGender', { reqGender: 'woman' });
    }

    // They must be looking for the viewer
    if (viewerGender === 'man') {
      qb.andWhere("(p.looking_for = 'men' OR p.looking_for = 'both')");
    } else if (viewerGender === 'woman') {
      qb.andWhere("(p.looking_for = 'women' OR p.looking_for = 'both')");
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

    // SORTING LOGIC FOR MOD 3
    // 1. People who already liked you (incomingLike = 1)
    qb.orderBy('"incomingLike"', 'DESC');
    // 2. Compatibility (simplified: matching goals could be computed in DB but we'll prioritize same region for now)
    // 3. Region proximity (sameRegion = 1)
    qb.addOrderBy('"sameRegion"', 'DESC');
    // 4. Activity Recency
    qb.addOrderBy('u.updated_at', 'DESC');
    qb.addOrderBy('u.created_at', 'DESC');

    qb.limit(20);

    return qb.getRawMany();
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BlocksRepository } from '../safety/repositories/blocks.repository';
import { SwipesRepository } from '../matches/repositories/swipes.repository';
import { MatchesRepository } from '../matches/repositories/matches.repository';
import { DiscoveryRepository } from './repositories/discovery.repository';
import { DiscoveryFiltersDto } from './dto/discovery-filters.dto';
import { PhotosService } from '../photos/photos.service';

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(
    private readonly blocksRepo: BlocksRepository,
    private readonly swipesRepo: SwipesRepository,
    private readonly matchesRepo: MatchesRepository,
    private readonly discoveryRepo: DiscoveryRepository,
    private readonly dataSource: DataSource,
    private readonly photosService: PhotosService,
  ) { }

  async getDiscoveryFeed(
    userId: string,
    viewerStatus: string,
    filters: DiscoveryFiltersDto,
  ) {
    // 1. Gather all IDs we MUST exclude (self, blocked, swiped, matched)
    const [blockedIds, swipedIds, matchedIds] = await Promise.all([
      this.blocksRepo.getExcludedUserIds(userId),
      this.swipesRepo.getSwipedUserIds(userId),
      this.matchesRepo.getMatchedUserIds(userId),
    ]);

    const excludedIds = [
      ...new Set([userId, ...blockedIds, ...swipedIds, ...matchedIds]),
    ];

    // Fetch viewer profile to apply bidirectional filtering
    const viewerProfile = await this.dataSource
      .query('SELECT gender, looking_for, region_id FROM profiles WHERE user_id = $1', [userId]);

    const viewerGender = viewerProfile[0]?.gender || 'man';
    const rawLookingFor = viewerProfile[0]?.looking_for;
    let viewerLookingFor: string[] = ['everyone'];

    if (Array.isArray(rawLookingFor)) {
      viewerLookingFor = rawLookingFor;
    } else if (typeof rawLookingFor === 'string' && rawLookingFor.length > 0) {
      viewerLookingFor = rawLookingFor.replace(/[{}]/g, '').split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (viewerLookingFor.length === 0) {
      viewerLookingFor = ['everyone'];
    }

    const viewerRegionId = viewerProfile[0]?.region_id || null;

    // 2. Fetch the paged and filtered results using the repository
    const rawProfiles = await this.discoveryRepo.findDiscoverablePaged(
      userId,
      viewerRegionId,
      null, // viewerGoals
      viewerGender,
      viewerLookingFor,
      excludedIds,
      filters,
    );

    // 3. Map into complete DiscoveryProfile objects
    return Promise.all(rawProfiles.map(async (p) => {
      let age = 25;
      if (p.dateOfBirth) {
        const dob = new Date(p.dateOfBirth);
        const diffMs = Date.now() - dob.getTime();
        const ageDate = new Date(diffMs);
        age = Math.abs(ageDate.getUTCFullYear() - 1970);
      }

      const profileId = p.id || p.userId;
      const nickname = p.nickname || 'Member';

      let photoUrl: string | undefined = undefined;
      if (p.primaryPhotoRef) {
        if (p.primaryPhotoRef.startsWith('http://') || p.primaryPhotoRef.startsWith('https://')) {
          photoUrl = p.primaryPhotoRef;
        } else {
          try {
            const { url } = await this.photosService.getPhotoUrl(`ph_${profileId}`, userId);
            photoUrl = url;
          } catch (e) {
            // Fallback avatar with nickname
            photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=1B4D5C&color=fff&size=512`;
          }
        }
      } else {
        photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=1B4D5C&color=fff&size=512`;
      }

      return {
        id: profileId,
        userId: p.userId || profileId,
        nickname,
        age,
        gender: p.gender || 'Not specified',
        region: p.region || 'Nearby',
        bio: p.bio || '',
        relationshipGoals: Array.isArray(p.relationshipGoals)
          ? p.relationshipGoals
          : [],
        isBlocked: false,
        photos: [
          {
            id: `ph_${profileId}`,
            blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
            url: photoUrl,
            revealGranted:
              p.isBlurred === false ||
              (viewerStatus === 'active' &&
                p.photosVisibleToVerified !== false),
          },
        ],
      };
    }));
  }
}

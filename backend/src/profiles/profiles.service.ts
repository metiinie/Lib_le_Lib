import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ProfilesRepository } from './repositories/profiles.repository';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly profilesRepository: ProfilesRepository) {}

  async getProfile(userId: string) {
    const profile = await this.profilesRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException({
        error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found.' },
      });
    }
    return profile;
  }

  async createProfile(userId: string, dto: CreateProfileDto) {
    const existing = await this.profilesRepository.findByUserId(userId);
    if (existing) {
      throw new ConflictException({
        error: { code: 'PROFILE_EXISTS', message: 'Profile already exists.' },
      });
    }

    // Business Rule: 18+ validation at application layer (in addition to DB constraint)
    const dob = new Date(dto.dateOfBirth);
    const ageInMilliseconds = Date.now() - dob.getTime();
    const ageInYears = ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);
    if (ageInYears < 18) {
      throw new BadRequestException({
        error: { code: 'UNDERAGE', message: 'You must be at least 18 years old.' },
      });
    }

    const interestTags = await this.profilesRepository.findTagsByIds(dto.interestTagIds || []);

    const profileData = {
      userId,
      nickname: dto.nickname,
      dateOfBirth: dto.dateOfBirth,
      gender: dto.gender,
      regionId: dto.regionId,
      relationshipGoals: dto.relationshipGoals,
      bio: dto.bio,
      discreetMode: dto.discreetMode,
      lowBandwidthMode: dto.lowBandwidthMode,
      preferredLanguage: dto.preferredLanguage,
      interestTags,
    };

    return this.profilesRepository.saveProfile(profileData);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.profilesRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException({
        error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found.' },
      });
    }

    if (dto.dateOfBirth) {
      const dob = new Date(dto.dateOfBirth);
      const ageInMilliseconds = Date.now() - dob.getTime();
      const ageInYears = ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);
      if (ageInYears < 18) {
        throw new BadRequestException({
          error: { code: 'UNDERAGE', message: 'You must be at least 18 years old.' },
        });
      }
      profile.dateOfBirth = dto.dateOfBirth;
    }

    if (dto.nickname !== undefined) profile.nickname = dto.nickname;
    if (dto.gender !== undefined) profile.gender = dto.gender;
    if (dto.regionId !== undefined) profile.regionId = dto.regionId;
    if (dto.relationshipGoals !== undefined) profile.relationshipGoals = dto.relationshipGoals;
    if (dto.bio !== undefined) profile.bio = dto.bio;
    if (dto.discreetMode !== undefined) profile.discreetMode = dto.discreetMode;
    if (dto.lowBandwidthMode !== undefined) profile.lowBandwidthMode = dto.lowBandwidthMode;
    if (dto.preferredLanguage !== undefined) profile.preferredLanguage = dto.preferredLanguage;

    if (dto.interestTagIds !== undefined) {
      profile.interestTags = await this.profilesRepository.findTagsByIds(dto.interestTagIds);
    }

    return this.profilesRepository.saveProfile(profile);
  }

  async getRegions() {
    return this.profilesRepository.findAllRegions();
  }

  async getInterestTags() {
    return this.profilesRepository.findAllInterestTags();
  }
}

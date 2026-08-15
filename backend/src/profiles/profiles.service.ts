import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ProfilesRepository } from './repositories/profiles.repository';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_secret_key_32_bytes_long_'; // Must be 32 bytes
const IV_LENGTH = 16;

function encrypt(text: string): string {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  if (!text) return text;
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) return text; // Probably not encrypted or old data
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    return text; // Return as-is if decryption fails
  }
}

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
    if (profile.virusType) {
      profile.virusType = decrypt(profile.virusType);
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
        error: {
          code: 'UNDERAGE',
          message: 'You must be at least 18 years old.',
        },
      });
    }

    const interestTags = await this.profilesRepository.findTagsByIds(
      dto.interestTagIds || [],
    );

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
      lookingFor: dto.lookingFor || ['everyone'],
      virusType: dto.virusType ? encrypt(dto.virusType) : undefined,
      photosVisibleToVerified: dto.photosVisibleToVerified ?? true,
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
          error: {
            code: 'UNDERAGE',
            message: 'You must be at least 18 years old.',
          },
        });
      }
      profile.dateOfBirth = dto.dateOfBirth;
    }

    if (dto.nickname !== undefined) profile.nickname = dto.nickname;
    if (dto.gender !== undefined) profile.gender = dto.gender;
    if (dto.regionId !== undefined) profile.regionId = dto.regionId;
    if (dto.relationshipGoals !== undefined)
      profile.relationshipGoals = dto.relationshipGoals;
    if (dto.bio !== undefined) profile.bio = dto.bio;
    if (dto.discreetMode !== undefined) profile.discreetMode = dto.discreetMode;
    if (dto.lowBandwidthMode !== undefined)
      profile.lowBandwidthMode = dto.lowBandwidthMode;
    if (dto.preferredLanguage !== undefined)
      profile.preferredLanguage = dto.preferredLanguage;
    if (dto.photosVisibleToVerified !== undefined)
      profile.photosVisibleToVerified = dto.photosVisibleToVerified;
    if (dto.lookingFor !== undefined) profile.lookingFor = dto.lookingFor;
    if (dto.virusType !== undefined) profile.virusType = encrypt(dto.virusType);

    if (dto.interestTagIds !== undefined) {
      profile.interestTags = await this.profilesRepository.findTagsByIds(
        dto.interestTagIds,
      );
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

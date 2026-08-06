import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';

/**
 * Repository for the `users` table.
 *
 * Per patterns.md: every table has exactly one repository; services call
 * repositories; nothing else does.
 */
@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.repo.findOne({ where: { phone } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  /**
   * Finds a user by phone or email destination.
   * Used during OTP verification to locate or create the user.
   */
  async findByDestination(destination: string): Promise<User | null> {
    const isEmail = destination.includes('@');
    if (isEmail) {
      return this.findByEmail(destination);
    }
    return this.findByPhone(destination);
  }

  /**
   * Creates a new user with phone or email set based on destination format.
   * Returns the newly created user.
   */
  async createFromDestination(destination: string): Promise<User> {
    const isEmail = destination.includes('@');
    const user = this.repo.create({
      phone: isEmail ? null : destination,
      email: isEmail ? destination : null,
    });
    return this.repo.save(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.repo.update(id, { lastLoginAt: new Date() });
  }

  /**
   * Persists a bcrypt-hashed password for the given user.
   * Called once after the user sets their password during registration.
   */
  async updatePasswordHash(id: string, hash: string): Promise<void> {
    await this.repo.update(id, { passwordHash: hash });
  }

  /**
   * Stamps the phone_verified_at timestamp once — after the one-time OTP is
   * successfully verified during registration. Never reset thereafter.
   */
  async updatePhoneVerifiedAt(id: string, date: Date): Promise<void> {
    await this.repo.update(id, { phoneVerifiedAt: date });
  }

  /**
   * Returns paginated users with optional search and role filtering (Admin endpoint).
   */
  async findAll(
    limit = 50,
    offset = 0,
    search?: string,
    role?: UserRole,
  ): Promise<[User[], number]> {
    const qb = this.repo.createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .orderBy('user.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    if (role) {
      qb.andWhere('"user"."role" = :role', { role });
    }

    if (search && search.trim().length > 0) {
      const q = `%${search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER("user"."email") LIKE :q OR LOWER("user"."phone") LIKE :q OR LOWER("profile"."nickname") LIKE :q OR CAST("user"."id" AS TEXT) LIKE :q)',
        { q },
      );
    }

    return qb.getManyAndCount();
  }

  async countByRole(role: UserRole): Promise<number> {
    return this.repo.count({ where: { role } });
  }

  async countTotal(): Promise<number> {
    return this.repo.count();
  }
}

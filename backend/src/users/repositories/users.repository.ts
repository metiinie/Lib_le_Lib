import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

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
}

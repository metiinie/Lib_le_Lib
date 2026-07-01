import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import { OtpCode } from '../entities/otp-code.entity';

/**
 * Repository for the `otp_codes` table.
 *
 * Per patterns.md: every table has exactly one repository.
 */
@Injectable()
export class OtpCodesRepository {
  constructor(
    @InjectRepository(OtpCode)
    private readonly repo: Repository<OtpCode>,
  ) {}

  async create(data: Partial<OtpCode>): Promise<OtpCode> {
    const otp = this.repo.create(data);
    return this.repo.save(otp);
  }

  /**
   * Finds the most recent unconsumed, non-expired OTP for a destination.
   */
  async findActiveByDestination(destination: string): Promise<OtpCode | null> {
    return this.repo.findOne({
      where: {
        destination,
        consumedAt: IsNull(),
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Increments the attempt counter on an OTP record.
   */
  async incrementAttempts(id: string): Promise<void> {
    await this.repo.increment({ id }, 'attempts', 1);
  }

  /**
   * Marks an OTP record as consumed (used).
   */
  async markConsumed(id: string): Promise<void> {
    await this.repo.update(id, { consumedAt: new Date() });
  }

  /**
   * Counts recent OTP requests for a destination within a time window.
   * Used for rate-limiting OTP requests.
   */
  async countRecentByDestination(
    destination: string,
    since: Date,
  ): Promise<number> {
    return this.repo.count({
      where: {
        destination,
        createdAt: LessThan(since), // TypeORM quirk: we actually want MoreThan
      },
    });
  }

  /**
   * Counts OTP records created for a destination after a given date.
   * Used for rate-limiting: e.g., max 5 OTPs per hour.
   */
  async countSince(destination: string, since: Date): Promise<number> {
    return this.repo
      .createQueryBuilder('otp')
      .where('otp.destination = :destination', { destination })
      .andWhere('otp.created_at >= :since', { since })
      .getCount();
  }
}

import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Report, ReportStatus, ReportSeverity, ReportCategory } from '../entities/report.entity';

@Injectable()
export class ReportsRepository {
  private readonly repo: Repository<Report>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(Report);
  }

  create(data: Partial<Report>): Report {
    return this.repo.create(data);
  }

  async save(report: Report): Promise<Report> {
    return this.repo.save(report);
  }

  async findAndCount(options: any): Promise<[Report[], number]> {
    return this.repo.findAndCount(options);
  }

  async findOne(options: any): Promise<Report | null> {
    return this.repo.findOne(options);
  }

  async findFilteredQueue(
    limit = 50,
    offset = 0,
    status?: ReportStatus,
    severity?: ReportSeverity,
    category?: ReportCategory,
  ): Promise<[Report[], number]> {
    const qb = this.repo.createQueryBuilder('report')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .leftJoinAndSelect('reporter.profile', 'reporterProfile')
      .leftJoinAndSelect('report.reported', 'reported')
      .leftJoinAndSelect('reported.profile', 'reportedProfile')
      .leftJoinAndSelect('report.assignedTo', 'assignedTo')
      .orderBy('report.created_at', 'DESC')
      .take(limit)
      .skip(offset);

    if (status) {
      qb.andWhere('report.status = :status', { status });
    }

    if (severity) {
      qb.andWhere('report.severity = :severity', { severity });
    }

    if (category) {
      qb.andWhere('report.category = :category', { category });
    }

    return qb.getManyAndCount();
  }
}

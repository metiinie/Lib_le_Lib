import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Report, ReportStatus } from '../entities/report.entity';

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
}

import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Resource } from '../entities/resource.entity';
import { CreateResourceDto } from '../dto/create-resource.dto';

@Injectable()
export class ResourcesRepository {
  private readonly repo: Repository<Resource>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(Resource);
  }

  async findPublished(limit: number, offset: number): Promise<Resource[]> {
    return this.repo.find({
      where: { published: true },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findById(id: string): Promise<Resource | null> {
    return this.repo.findOne({ where: { id } });
  }

  async createResource(
    adminUserId: string,
    createDto: CreateResourceDto,
  ): Promise<Resource> {
    const resource = this.repo.create({
      ...createDto,
      createdByUserId: adminUserId,
    });
    return this.repo.save(resource);
  }

  async saveResource(resource: Resource): Promise<Resource> {
    return this.repo.save(resource);
  }
}

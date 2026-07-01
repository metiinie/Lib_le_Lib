import { Injectable, NotFoundException } from '@nestjs/common';
import { ResourcesRepository } from './repositories/resources.repository';
import { Resource } from './entities/resource.entity';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';

@Injectable()
export class ResourcesService {
  constructor(private readonly resourcesRepository: ResourcesRepository) {}

  async getPublishedResources(limit = 50, offset = 0): Promise<Resource[]> {
    return this.resourcesRepository.findPublished(limit, offset);
  }

  async createResource(
    adminUserId: string,
    createDto: CreateResourceDto,
  ): Promise<Resource> {
    return this.resourcesRepository.createResource(adminUserId, createDto);
  }

  async updateResource(
    id: string,
    updateDto: UpdateResourceDto,
  ): Promise<Resource> {
    const resource = await this.resourcesRepository.findById(id);
    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    Object.assign(resource, updateDto);
    return this.resourcesRepository.saveResource(resource);
  }
}

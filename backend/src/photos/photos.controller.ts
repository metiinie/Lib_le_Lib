import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PhotosService } from './photos.service';
import { RegisterPhotoDto, RequestUploadUrlDto, GrantRevealDto } from './dto/photos.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('photos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  /**
   * Step 1: client requests a signed PUT URL.
   * Returns { uploadUrl, storageRef }. Client uploads directly to R2.
   */
  @Post('upload-url')
  @ApiResponse({ status: 201, description: 'Signed upload URL generated.' })
  async getUploadUrl(
    @CurrentUser() user: { id: string },
    @Body() dto: RequestUploadUrlDto,
  ) {
    return this.photosService.getUploadUrl(user.id, dto.contentType);
  }

  /**
   * Step 2: client registers the photo row after upload completes.
   */
  @Post()
  @ApiResponse({ status: 201, description: 'Photo registered.' })
  async registerPhoto(
    @CurrentUser() user: { id: string },
    @Body() dto: RegisterPhotoDto,
  ) {
    return this.photosService.registerPhoto(user.id, dto);
  }

  /**
   * Resolves blur/reveal for a viewer.
   * Constraints.md: "A photo is never sent unblurred to a client unless an
   * active, non-revoked photo_reveal_grants row exists for that exact viewer."
   */
  @Get(':id')
  @ApiResponse({ status: 200, description: 'Returns a signed URL (blurred or original).' })
  async getPhoto(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) photoId: string,
  ) {
    return this.photosService.getPhotoUrl(photoId, user.id);
  }

  /**
   * Grants reveal access to another user.
   * Only the photo owner may call this endpoint.
   */
  @Post(':id/reveal-grants')
  @ApiResponse({ status: 201, description: 'Reveal grant created.' })
  @ApiResponse({ status: 403, description: 'Not the photo owner.' })
  @ApiResponse({ status: 409, description: 'Grant already exists.' })
  async grantReveal(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) photoId: string,
    @Body() dto: GrantRevealDto,
  ) {
    return this.photosService.grantReveal(photoId, user.id, dto);
  }

  /**
   * Revokes a reveal grant, re-blurring the photo for that viewer.
   * Only the photo owner may call this endpoint.
   */
  @Delete(':id/reveal-grants/:viewerUserId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204, description: 'Grant revoked.' })
  @ApiResponse({ status: 403, description: 'Not the photo owner.' })
  async revokeReveal(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) photoId: string,
    @Param('viewerUserId', ParseUUIDPipe) viewerUserId: string,
  ) {
    await this.photosService.revokeReveal(photoId, user.id, viewerUserId);
  }
}

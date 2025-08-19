import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { HttpClientService } from '../services/http-client.service';
import { AuthGuard } from '../guards/auth.guard';
import { RateLimit, RateLimitGuard } from '../guards/rate-limit.guard';

/**
 * Media & File Controller - Handles file upload, storage, and CDN
 * Routes requests to Media & File Service
 * Includes: file upload, file management, avatars, file sharing
 */
@Controller()
@UseGuards(AuthGuard, RateLimitGuard)
export class MediaFileController {
  constructor(private readonly httpClient: HttpClientService) {}

  // ============= FILE UPLOAD ENDPOINTS =============

  @Post('files/upload')
  @UseInterceptors(FileInterceptor('file'))
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 uploads per minute
  async uploadFile(@UploadedFile() file: any, @Request() req: any) {
    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', file.buffer, file.originalname);
    formData.append('uploaderId', req.user.id);

    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'media-file',
      '/files/upload',
      formData,
      {
        ...config,
        headers: {
          ...config.headers,
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  }

  @Post('files/upload-multiple')
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  @RateLimit({ limit: 5, windowMs: 60 * 1000 }) // 5 batch uploads per minute
  async uploadMultipleFiles(
    @UploadedFiles() files: any[],
    @Request() req: any,
  ) {
    const formData = new FormData();

    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file.buffer, file.originalname);
    });
    formData.append('uploaderId', req.user.id);

    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'media-file',
      '/files/upload-multiple',
      formData,
      {
        ...config,
        headers: {
          ...config.headers,
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  }

  // ============= FILE MANAGEMENT ENDPOINTS =============

  @Get('files/:id')
  @RateLimit({ limit: 100, windowMs: 60 * 1000 }) // 100 requests per minute
  async getFileInfo(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'media-file',
      `/files/${id}?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Delete('files/:id')
  @RateLimit({ limit: 20, windowMs: 60 * 1000 }) // 20 deletes per minute
  async deleteFile(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.delete(
      'media-file',
      `/files/${id}?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Get('files/user/:userId')
  @RateLimit({ limit: 50, windowMs: 60 * 1000 }) // 50 requests per minute
  async getUserFiles(@Param('userId') userId: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'media-file',
      `/files/user/${userId}?requesterId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  // ============= AVATAR MANAGEMENT ENDPOINTS =============

  @Post('avatars/upload')
  @UseInterceptors(FileInterceptor('avatar'))
  @RateLimit({ limit: 10, windowMs: 60 * 1000 }) // 10 avatar uploads per minute
  async uploadAvatar(@UploadedFile() file: any, @Request() req: any) {
    const formData = new FormData();
    formData.append('avatar', file.buffer, file.originalname);
    formData.append('userId', req.user.id);

    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'media-file',
      '/avatars/upload',
      formData,
      {
        ...config,
        headers: {
          ...config.headers,
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  }

  @Delete('avatars/:userId')
  @RateLimit({ limit: 10, windowMs: 60 * 1000 }) // 10 deletes per minute
  async deleteAvatar(@Param('userId') userId: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.delete(
      'media-file',
      `/avatars/${userId}?requesterId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  // ============= SERVER ICON MANAGEMENT ENDPOINTS =============

  @Post('servers/:serverId/icon')
  @UseInterceptors(FileInterceptor('icon'))
  @RateLimit({ limit: 5, windowMs: 60 * 1000 }) // 5 server icon uploads per minute
  async uploadServerIcon(
    @Param('serverId') serverId: string,
    @UploadedFile() file: any,
    @Request() req: any,
  ) {
    const formData = new FormData();
    formData.append('icon', file.buffer, file.originalname);
    formData.append('serverId', serverId);
    formData.append('userId', req.user.id);

    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'media-file',
      `/servers/${serverId}/icon`,
      formData,
      {
        ...config,
        headers: {
          ...config.headers,
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  }

  @Delete('servers/:serverId/icon')
  @RateLimit({ limit: 5, windowMs: 60 * 1000 }) // 5 deletes per minute
  async deleteServerIcon(
    @Param('serverId') serverId: string,
    @Request() req: any,
  ) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.delete(
      'media-file',
      `/servers/${serverId}/icon?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  // ============= FILE SHARING ENDPOINTS =============

  @Post('files/:id/share')
  @RateLimit({ limit: 30, windowMs: 60 * 1000 }) // 30 shares per minute
  async shareFile(
    @Param('id') id: string,
    @Body() shareDto: any,
    @Request() req: any,
  ) {
    const shareData = {
      ...shareDto,
      userId: req.user.id,
    };

    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.post(
      'media-file',
      `/files/${id}/share`,
      shareData,
      config,
    );
    return response.data;
  }

  @Get('files/shared/:token')
  @RateLimit({ limit: 100, windowMs: 60 * 1000 }) // 100 requests per minute
  async getSharedFile(@Param('token') token: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'media-file',
      `/files/shared/${token}?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  // ============= CDN & OPTIMIZATION ENDPOINTS =============

  @Get('files/:id/thumbnail')
  @RateLimit({ limit: 200, windowMs: 60 * 1000 }) // 200 requests per minute
  async getFileThumbnail(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'media-file',
      `/files/${id}/thumbnail?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Get('files/:id/download')
  @RateLimit({ limit: 50, windowMs: 60 * 1000 }) // 50 downloads per minute
  async downloadFile(@Param('id') id: string, @Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'media-file',
      `/files/${id}/download?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  // ============= FILE ANALYTICS ENDPOINTS =============

  @Get('files/analytics/usage')
  @RateLimit({ limit: 10, windowMs: 60 * 1000 }) // 10 requests per minute
  async getFileUsageAnalytics(@Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'media-file',
      `/files/analytics/usage?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }

  @Get('files/analytics/storage')
  @RateLimit({ limit: 10, windowMs: 60 * 1000 }) // 10 requests per minute
  async getStorageAnalytics(@Request() req: any) {
    const config = this.httpClient.createConfigWithAuth(req.token);
    const response = await this.httpClient.get(
      'media-file',
      `/files/analytics/storage?userId=${req.user.id}`,
      config,
    );
    return response.data;
  }
}

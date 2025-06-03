import { Injectable, HttpException } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ConfigService } from '../config/config.service';

@Injectable()
export class HttpClientService {
  private readonly clients: Map<string, AxiosInstance> = new Map();

  constructor(private configService: ConfigService) {
    this.initializeClients();
  }

  private initializeClients() {
    const services = {
      auth: this.configService.authServiceUrl,
      user: this.configService.userServiceUrl,
      server: this.configService.serverServiceUrl,
      channel: this.configService.channelServiceUrl,
      message: this.configService.messageServiceUrl,
      friend: this.configService.friendServiceUrl,
      dm: this.configService.dmServiceUrl,
      file: this.configService.fileServiceUrl,
      role: this.configService.roleServiceUrl,
      voice: this.configService.voiceServiceUrl,
      notification: this.configService.notificationServiceUrl,
      security: this.configService.securityServiceUrl,
      analytics: this.configService.analyticsServiceUrl,
    };

    Object.entries(services).forEach(([serviceName, baseURL]) => {
      const client = axios.create({
        baseURL,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Request interceptor
      client.interceptors.request.use(
        (config) => {
          console.log(
            `[${serviceName.toUpperCase()}] ${config.method?.toUpperCase()} ${config.url}`,
          );
          return config;
        },
        (error) => {
          console.error(`[${serviceName.toUpperCase()}] Request Error:`, error);
          return Promise.reject(error);
        },
      );

      // Response interceptor
      client.interceptors.response.use(
        (response) => {
          console.log(
            `[${serviceName.toUpperCase()}] Response: ${response.status}`,
          );
          return response;
        },
        (error) => {
          console.error(
            `[${serviceName.toUpperCase()}] Response Error:`,
            error.response?.data || error.message,
          );
          return Promise.reject(error);
        },
      );

      this.clients.set(serviceName, client);
    });
  }

  async get<T = any>(
    service: string,
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const client = this.getClient(service);
    try {
      return await client.get<T>(url, config);
    } catch (error) {
      this.handleError(error);
    }
  }

  async post<T = any>(
    service: string,
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const client = this.getClient(service);
    try {
      return await client.post<T>(url, data, config);
    } catch (error) {
      this.handleError(error);
    }
  }

  async put<T = any>(
    service: string,
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const client = this.getClient(service);
    try {
      return await client.put<T>(url, data, config);
    } catch (error) {
      this.handleError(error);
    }
  }

  async patch<T = any>(
    service: string,
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const client = this.getClient(service);
    try {
      return await client.patch<T>(url, data, config);
    } catch (error) {
      this.handleError(error);
    }
  }

  async delete<T = any>(
    service: string,
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const client = this.getClient(service);
    try {
      return await client.delete<T>(url, config);
    } catch (error) {
      this.handleError(error);
    }
  }

  private getClient(service: string): AxiosInstance {
    const client = this.clients.get(service);
    if (!client) {
      throw new HttpException(`Service ${service} not found`, 500);
    }
    return client;
  }

  private handleError(error: any): never {
    if (error.response) {
      // Server responded with error status
      throw new HttpException(
        error.response.data?.message || 'Service error',
        error.response.status,
      );
    } else if (error.request) {
      // Network error
      throw new HttpException('Service unavailable', 503);
    } else {
      // Other error
      throw new HttpException('Internal server error', 500);
    }
  }

  // Helper method to forward authorization header
  createConfigWithAuth(token?: string): AxiosRequestConfig {
    return {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
  }
}

import { Controller, Get } from '@nestjs/common';
import { HttpClientService } from '../services/http-client.service';
import { ConfigService } from '../config/config.service';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly httpClient: HttpClientService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  async getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      gateway: {
        status: 'healthy',
        port: this.configService.gatewayPort,
      },
    };
  }

  @Get('services')
  async getServicesHealth() {
    const services = [
      { name: 'auth', url: this.configService.authServiceUrl },
      { name: 'user', url: this.configService.userServiceUrl },
      { name: 'server', url: this.configService.serverServiceUrl },
      { name: 'channel', url: this.configService.channelServiceUrl },
      { name: 'message', url: this.configService.messageServiceUrl },
      { name: 'friend', url: this.configService.friendServiceUrl },
      { name: 'dm', url: this.configService.dmServiceUrl },
      { name: 'file', url: this.configService.fileServiceUrl },
      { name: 'role', url: this.configService.roleServiceUrl },
      { name: 'voice', url: this.configService.voiceServiceUrl },
      { name: 'notification', url: this.configService.notificationServiceUrl },
      { name: 'security', url: this.configService.securityServiceUrl },
      { name: 'analytics', url: this.configService.analyticsServiceUrl },
    ];

    const healthChecks = await Promise.allSettled(
      services.map(async (service) => {
        try {
          // Assuming each service has a /health endpoint
          const response = await this.httpClient.get(service.name, '/health');
          return {
            service: service.name,
            status: 'healthy',
            url: service.url,
            responseTime: response.headers['x-response-time'] || 'N/A',
          };
        } catch (error) {
          return {
            service: service.name,
            status: 'unhealthy',
            url: service.url,
            error: error.message,
          };
        }
      }),
    );

    // Check Redis health
    let redisHealth;
    try {
      await this.redisService.set('health-check', 'ok', 10);
      const result = await this.redisService.get('health-check');
      redisHealth = {
        service: 'redis',
        status: result === 'ok' ? 'healthy' : 'unhealthy',
        url: `${this.configService.redisHost}:${this.configService.redisPort}`,
      };
    } catch (error) {
      redisHealth = {
        service: 'redis',
        status: 'unhealthy',
        url: `${this.configService.redisHost}:${this.configService.redisPort}`,
        error: error.message,
      };
    }

    const results = healthChecks.map((check) =>
      check.status === 'fulfilled' ? check.value : check.reason,
    );

    const healthyServices = results.filter(
      (r) => r.status === 'healthy',
    ).length;
    const totalServices = results.length + 1; // +1 for Redis

    return {
      overview: {
        total: totalServices,
        healthy: healthyServices + (redisHealth.status === 'healthy' ? 1 : 0),
        unhealthy:
          totalServices -
          healthyServices -
          (redisHealth.status === 'healthy' ? 1 : 0),
      },
      services: [...results, redisHealth],
      timestamp: new Date().toISOString(),
    };
  }
}

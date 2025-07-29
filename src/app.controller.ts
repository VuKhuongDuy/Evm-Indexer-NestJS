import { Controller, Get, Param, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { AppConfigService } from './config/config.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Default')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: AppConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get Hello World' })
  @ApiResponse({ status: 200, description: 'Returns Hello World string.' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('ping')
  @ApiOperation({ summary: 'Ping endpoint' })
  @ApiResponse({ status: 200, description: 'Returns pong.' })
  ping() {
    return { message: 'pong' };
  }

  @Get('config')
  @ApiOperation({ summary: 'Get application configuration' })
  @ApiResponse({
    status: 200,
    description:
      'Returns application configuration from environment variables.',
  })
  getConfig() {
    return this.configService.getAllConfig();
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get all orders' })
  @ApiResponse({ status: 200, description: 'Returns all orders.' })
  getOrders(
    @Query('limit') limit: number = 200,
    @Query('offset') offset: number = 0,
  ) {
    return this.appService.getOrders(limit, offset);
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { OrderService } from './order.service';
import {
  GetOrdersByTokenDto,
  GetOrdersBySellerDto,
  PaginatedOrderResponseDto,
} from './dto/order.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('by-token')
  @ApiOperation({ summary: 'Get orders by token address' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of orders for the specified token',
    type: PaginatedOrderResponseDto,
  })
  @ApiQuery({
    name: 'tokenAddress',
    description: 'Token address to filter by',
    example: '0x1234567890123456789012345678901234567890',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    example: 10,
  })
  @ApiQuery({
    name: 'sortBy',
    description: 'Sort order for price',
    required: false,
    enum: ['asc', 'desc'],
    example: 'asc',
  })
  async getOrdersByToken(
    @Query() dto: GetOrdersByTokenDto,
  ): Promise<PaginatedOrderResponseDto> {
    return this.orderService.getOrdersByToken(dto);
  }

  @Get('by-seller')
  @ApiOperation({ summary: 'Get orders by seller address' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of orders for the specified seller',
    type: PaginatedOrderResponseDto,
  })
  @ApiQuery({
    name: 'sellerAddress',
    description: 'Seller address to filter by',
    example: '0x1234567890123456789012345678901234567890',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    example: 10,
  })
  @ApiQuery({
    name: 'sortBy',
    description: 'Sort order for price',
    required: false,
    enum: ['asc', 'desc'],
    example: 'asc',
  })
  async getOrdersBySeller(
    @Query() dto: GetOrdersBySellerDto,
  ): Promise<PaginatedOrderResponseDto> {
    return this.orderService.getOrdersBySeller(dto);
  }
}

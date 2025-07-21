import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../database/entities/order.entity';
import {
  OrderResponseDto,
  PaginatedOrderResponseDto,
  GetOrdersByTokenDto,
  GetOrdersBySellerDto,
} from './dto/order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async getOrdersByToken(
    dto: GetOrdersByTokenDto,
  ): Promise<PaginatedOrderResponseDto> {
    const { tokenAddress, page = 1, limit = 10, sortBy = 'asc' } = dto;
    const skip = (page - 1) * limit;

    const [orders, total] = await this.orderRepository.findAndCount({
      where: [
        { tokenToSell: tokenAddress, isActive: true },
        { tokenToPay: tokenAddress, isActive: true },
      ],
      order: {
        pricePerToken: sortBy === 'asc' ? 'ASC' : 'DESC',
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      orders: orders.map(this.mapOrderToDto),
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev,
    };
  }

  async getOrdersBySeller(
    dto: GetOrdersBySellerDto,
  ): Promise<PaginatedOrderResponseDto> {
    const { sellerAddress, page = 1, limit = 10, sortBy = 'asc' } = dto;
    const skip = (page - 1) * limit;

    const [orders, total] = await this.orderRepository.findAndCount({
      where: {
        seller: sellerAddress,
        isActive: true,
      },
      order: {
        pricePerToken: sortBy === 'asc' ? 'ASC' : 'DESC',
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      orders: orders.map(this.mapOrderToDto),
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev,
    };
  }

  private mapOrderToDto(order: Order): OrderResponseDto {
    return {
      orderId: order.orderId,
      seller: order.seller,
      tokenToSell: order.tokenToSell,
      tokenToPay: order.tokenToPay,
      amountToSell: order.amountToSell,
      amountRemaining: order.amountRemaining,
      pricePerToken: order.pricePerToken,
      minOrderSize: order.minOrderSize,
      isActive: order.isActive,
      createdAtBlockNumber: order.createdAtBlockNumber,
    };
  }
}

import { ApiProperty } from '@nestjs/swagger';

export class OrderResponseDto {
  @ApiProperty({ description: 'Order ID' })
  orderId: string;

  @ApiProperty({ description: 'Seller address' })
  seller: string;

  @ApiProperty({ description: 'Token address to sell' })
  tokenToSell: string;

  @ApiProperty({ description: 'Token address to pay with' })
  tokenToPay: string;

  @ApiProperty({ description: 'Total amount to sell' })
  amountToSell: string;

  @ApiProperty({ description: 'Remaining amount to sell' })
  amountRemaining: string;

  @ApiProperty({ description: 'Price per token' })
  pricePerToken: string;

  @ApiProperty({ description: 'Minimum order size' })
  minOrderSize: string;

  @ApiProperty({ description: 'Whether the order is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Block number when order was created' })
  createdAtBlockNumber: number;
}

export class PaginationDto {
  @ApiProperty({ description: 'Page number', default: 1, minimum: 1 })
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  limit?: number = 10;
}

export class OrderSortDto extends PaginationDto {
  @ApiProperty({
    description: 'Sort order for price',
    enum: ['asc', 'desc'],
    default: 'asc',
  })
  sortBy?: 'asc' | 'desc' = 'asc';
}

export class GetOrdersByTokenDto extends OrderSortDto {
  @ApiProperty({ description: 'Token address to filter by' })
  tokenAddress: string;
}

export class GetOrdersBySellerDto extends OrderSortDto {
  @ApiProperty({ description: 'Seller address to filter by' })
  sellerAddress: string;
}

export class PaginatedOrderResponseDto {
  @ApiProperty({ description: 'List of orders' })
  orders: OrderResponseDto[];

  @ApiProperty({ description: 'Total number of orders' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPrev: boolean;
}

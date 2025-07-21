import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { Order } from '../database/entities/order.entity';
import { GetOrdersByTokenDto, GetOrdersBySellerDto } from './dto/order.dto';

describe('OrderService', () => {
  let service: OrderService;

  const mockRepository = {
    findAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrdersByToken', () => {
    it('should return paginated orders for token', async () => {
      const mockOrders = [
        {
          orderId: '1',
          seller: '0x123',
          tokenToSell: '0x456',
          tokenToPay: '0x789',
          amountToSell: '1000',
          amountRemaining: '500',
          pricePerToken: '100',
          minOrderSize: '10',
          isActive: true,
          createdAtBlockNumber: 12345,
        },
      ];

      mockRepository.findAndCount.mockResolvedValue([mockOrders, 1]);

      const dto: GetOrdersByTokenDto = {
        tokenAddress: '0x456',
        page: 1,
        limit: 10,
        sortBy: 'asc',
      };

      const result = await service.getOrdersByToken(dto);

      expect(result.orders).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(false);
    });
  });

  describe('getOrdersBySeller', () => {
    it('should return paginated orders for seller', async () => {
      const mockOrders = [
        {
          orderId: '1',
          seller: '0x123',
          tokenToSell: '0x456',
          tokenToPay: '0x789',
          amountToSell: '1000',
          amountRemaining: '500',
          pricePerToken: '100',
          minOrderSize: '10',
          isActive: true,
          createdAtBlockNumber: 12345,
        },
      ];

      mockRepository.findAndCount.mockResolvedValue([mockOrders, 1]);

      const dto: GetOrdersBySellerDto = {
        sellerAddress: '0x123',
        page: 1,
        limit: 10,
        sortBy: 'asc',
      };

      const result = await service.getOrdersBySeller(dto);

      expect(result.orders).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(false);
    });
  });
});

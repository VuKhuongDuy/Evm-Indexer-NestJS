import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Order {
  @PrimaryColumn()
  orderId: string;

  @Column()
  seller: string;

  @Column()
  tokenToSell: string;

  @Column()
  tokenToPay: string;

  @Column()
  amountToSell: string;

  @Column()
  amountRemaining: string;

  @Column()
  pricePerToken: string;

  @Column()
  minOrderSize: string;

  @Column()
  isActive: boolean;

  @Column()
  createdAtBlockNumber: number;
}

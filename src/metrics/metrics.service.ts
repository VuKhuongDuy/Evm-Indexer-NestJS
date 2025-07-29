import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Gauge } from 'prom-client';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('orders_placed_total')
    public ordersPlacedTotal: Gauge<string>,
    @InjectMetric('orders_filled_total')
    public ordersFilledTotal: Gauge<string>,
    @InjectMetric('indexer_logs_queue_size')
    public indexerLogsQueueSize: Gauge<string>,
    @InjectMetric('indexer_backlog_queue_size')
    public indexerBacklogQueueSize: Gauge<string>,
  ) {}

  setLogsQueueSize(size: number) {
    this.indexerLogsQueueSize.set(size);
  }

  setBacklogQueueSize(size: number) {
    this.indexerBacklogQueueSize.set(size);
  }
}

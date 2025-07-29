import { makeGaugeProvider } from '@willsoto/nestjs-prometheus';

export const metricsProviders = [
  makeGaugeProvider({
    name: 'orders_placed_total',
    help: 'Number of orders placed',
  }),
  makeGaugeProvider({
    name: 'orders_filled_total',
    help: 'Number of orders filled',
  }),
  makeGaugeProvider({
    name: 'indexer_logs_queue_size',
    help: 'Indexer logs queue size',
  }),
  makeGaugeProvider({
    name: 'indexer_backlog_queue_size',
    help: 'Indexer backlog queue size',
  }),
];

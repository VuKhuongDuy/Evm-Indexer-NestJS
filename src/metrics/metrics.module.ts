import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';
import { metricsProviders } from './metrics.provider';

@Module({
  imports: [PrometheusModule.register()],
  providers: [MetricsService, ...metricsProviders],
  exports: [MetricsService],
})
export class MetricsModule {}

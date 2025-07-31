// Ficheiro: api/src/reports/reports.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Report } from './entities/report.entity';
import { Recommendation } from './entities/recommendation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Report, Recommendation])], // Registre as entidades de relatório aqui
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
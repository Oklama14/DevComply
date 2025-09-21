// api/src/reports/reports.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Report } from './entities/report.entity';
import { Recommendation } from './entities/recommendation.entity';
import { AiModule } from '../services/ai.module'; // Import AiModule here

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, Recommendation]),
    AiModule // Import the module exporting AiService
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}

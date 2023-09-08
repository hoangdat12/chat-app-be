import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportModel } from '../schema/report.model';
import { ReportRepository } from './report.repository';

@Module({
  imports: [MongooseModule.forFeature([ReportModel])],
  providers: [ReportService, ReportRepository],
  controllers: [ReportController],
})
export class ReportModule {}

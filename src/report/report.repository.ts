import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Report } from '../schema/report.model';
import { Model } from 'mongoose';
import { CreateReportPayload } from './report.dto';
import { checkNegativeNumber, convertObjectId } from '../ultils';
import { Pagination } from '../ultils/interface';

@Injectable()
export class ReportRepository {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<Report>,
  ) {}

  async create(data: CreateReportPayload) {
    return await this.reportModel.create({
      report_email: data.email,
      report_describe: data.describe,
      report_problem: data.problem,
      report_tags: data.tags,
    });
  }

  async delete(reportId: string) {
    return await this.reportModel.deleteOne({
      _id: convertObjectId(reportId),
    });
  }

  async findAll(pagination: Pagination) {
    const { limit, sortBy, page } = checkNegativeNumber(pagination);
    const offset = (page - 1) * limit;
    return await this.reportModel
      .find()
      .skip(offset)
      .limit(limit)
      .sort(sortBy === 'ctime' ? { createdAt: -1 } : { createdAt: 1 })
      .select(['_id', 'report_email', 'report_problem', 'report_tags'])
      .lean()
      .exec();
  }

  async findById(reportId: string) {
    return await this.reportModel
      .findOne({ _id: convertObjectId(reportId) })
      .lean();
  }
}

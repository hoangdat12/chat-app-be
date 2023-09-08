import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ReportRepository } from './report.repository';
import { CreateReportPayload } from './report.dto';
import { IUserCreated, Pagination } from '../ultils/interface';

@Injectable()
export class ReportService {
  constructor(private readonly reportRepository: ReportRepository) {}

  async viewReport(user: IUserCreated, reportId: string) {
    if (user.role !== 'ADMIN' && user.role !== 'STAFF')
      throw new HttpException('User not permission!', HttpStatus.BAD_REQUEST);
    return await this.reportRepository.findById(reportId);
  }

  async getAllReport(user: IUserCreated, pagination: Pagination) {
    if (user.role !== 'ADMIN' && user.role !== 'STAFF')
      throw new HttpException('User not permission!', HttpStatus.BAD_REQUEST);
    return await this.reportRepository.findAll(pagination);
  }

  async createReport(data: CreateReportPayload) {
    return await this.reportRepository.create(data);
  }

  async solvedReport(user: IUserCreated, reportId: string) {
    if (user.role !== 'ADMIN' && user.role !== 'STAFF')
      throw new HttpException('User not permission!', HttpStatus.BAD_REQUEST);

    return await this.reportRepository.delete(reportId);
  }
}

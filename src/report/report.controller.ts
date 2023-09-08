import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { Request } from 'express';
import { CreateReportPayload } from './report.dto';
import { validate } from 'class-validator';
import { IUserCreated, Pagination } from '../ultils/interface';
import { Created, Ok } from '../ultils/response';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('/')
  async createReport(@Body() data: CreateReportPayload) {
    try {
      const errors = await validate(data);
      if (errors.length)
        throw new HttpException(
          'Missing request value!',
          HttpStatus.BAD_REQUEST,
        );
      return new Created(await this.reportService.createReport(data));
    } catch (error) {
      throw error;
    }
  }

  @Delete('/:reportId')
  async solvedReport(@Req() req: Request, @Param('reportId') reportId: string) {
    try {
      const user = req.user as IUserCreated;
      return new Ok(await this.reportService.solvedReport(user, reportId));
    } catch (error) {
      throw error;
    }
  }

  @Get('')
  async viewAllReport(
    @Req() req: Request,
    @Query('limit') limit: string | '20',
    @Query('page') page: string | '1',
    @Query('sortedBy') sortedBy: string | 'ctime',
  ) {
    try {
      const user = req.user as IUserCreated;
      const pagination: Pagination = {
        limit: parseInt(limit),
        page: parseInt(page),
        sortBy: sortedBy,
      };
      return new Ok(await this.reportService.getAllReport(user, pagination));
    } catch (error) {
      throw error;
    }
  }

  @Get('/:reportId')
  async viewReport(@Req() req: Request, @Param('reportId') reportId: string) {
    try {
      const user = req.user as IUserCreated;
      return new Ok(await this.reportService.viewReport(user, reportId));
    } catch (error) {
      throw error;
    }
  }
}

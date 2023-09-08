import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class ErrorHandler implements ExceptionFilter {
  catch(err: any, host: ArgumentsHost) {
    console.log(err);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const statusCode = err.status || 500;
    response.status(statusCode).json({
      status: 'Error',
      code: statusCode,
      metaData: {
        message:
          err?.response?.message || err?.message || 'Internal Server Error!',
      },
    });
  }
}

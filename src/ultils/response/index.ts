import { Response } from 'express';
import { HttpStatus } from '@nestjs/common';

abstract class SuccessResponse<T> {
  message: string;
  status: number;
  metaData: T;

  constructor(message: string, status: number, metaData: T = null) {
    this.message = message;
    this.status = status;
    this.metaData = metaData;
  }

  public sender(res: Response) {
    return res.status(this.status).json(this);
  }
}

export class Ok<T> extends SuccessResponse<T> {
  constructor(metaData: T = null, message: string = 'Ok') {
    super(message, HttpStatus.OK, metaData);
  }
}

export class Created<T> extends SuccessResponse<T> {
  constructor(metaData: T = null, message: string = 'Created') {
    super(message, HttpStatus.CREATED, metaData);
  }
}

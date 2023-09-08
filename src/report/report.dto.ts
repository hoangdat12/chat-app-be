import { IsNotEmpty } from 'class-validator';

export class CreateReportPayload {
  @IsNotEmpty()
  email: string;
  @IsNotEmpty()
  problem: string;
  tags: string[];
  @IsNotEmpty()
  describe: string;
}

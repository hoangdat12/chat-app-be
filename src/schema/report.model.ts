import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'Report', timestamps: true })
export class Report {
  @Prop()
  report_email: string;

  @Prop()
  report_problem: string;

  @Prop()
  report_tags: string[];

  @Prop()
  report_describe: string;
}
const ReportSchema = SchemaFactory.createForClass(Report);

export const ReportModel = {
  name: Report.name,
  schema: ReportSchema,
};

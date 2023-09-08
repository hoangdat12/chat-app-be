import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailSenderService {
  private readonly transporter: any;
  private readonly email = 'datttp113@gmail.com';

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: this.email,
        pass: process.env.SECRET_EMAIL_KEY,
      },
    });
  }

  async sendEmailWithText(recipient: string, subject: string, content: string) {
    try {
      await this.transporter.sendMail({
        from: this.email,
        to: recipient,
        subject: subject,
        text: content,
      });
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email', error);
    }
  }

  async sendEmailWithHTML(recipient: string, subject: string) {
    try {
      await this.transporter.sendMail({
        from: this.email,
        to: recipient,
        subject: subject,
        html: 'This is a test email',
      });
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email', error);
    }
  }
}

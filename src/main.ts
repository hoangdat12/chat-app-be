import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import helmet from 'helmet';
import * as compression from 'compression';
import * as session from 'express-session';
import * as passport from 'passport';
import * as cookieParser from 'cookie-parser';
import { ErrorHandler } from './handler/error.handler';
import { WebsocketAdapter } from './gateway/gateway.adapter';
import { KeyTokenRepository } from './auth/repository/keyToken.repository';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // MIDDLEWARE
  app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
  app.use(compression());
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new ErrorHandler());
  const adapter = new WebsocketAdapter(app, app.get(KeyTokenRepository));
  app.useWebSocketAdapter(adapter);
  app.use(cookieParser());
  app.use(
    session({
      secret: process.env.SESSION_SECRET_KEY,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        maxAge: 1800000,
      },
    }),
  );
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.use(passport.initialize());
  app.use(passport.session());

  await app.listen(process.env.PORT || 8080);
}
bootstrap();

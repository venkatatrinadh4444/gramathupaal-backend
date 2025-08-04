import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { DocumentBuilder,SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv'

async function bootstrap() {
  dotenv.config()
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin:["https://gramathupaal.vercel.app","http://localhost:3000","https://gramathupal.vercel.app"],
    credentials: true,
    })
  const config=new DocumentBuilder()
  .setTitle('Gramathupaal')
  .setDescription('This is the API Documentation for the Gramathupaal project')
  .setVersion('1.0')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT', // Optional
      in: 'header',
    },
    'access-token', // Optional name, must match in @ApiBearerAuth('access-token')
  )
  .build()

  const document=SwaggerModule.createDocument(app,config)
  SwaggerModule.setup('api',app,document)
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist:true,
    transform:true,
    exceptionFactory: (errors) => {
      const firstError=errors[0]
      const constraints=firstError?.constraints
      const firstMessage=constraints?Object.values(constraints)[0]:'validation failed'
      return new BadRequestException(firstMessage)
    }
  }))
  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();

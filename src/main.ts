import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS - allow all origins for now
  app.enableCors({
    origin: true, // Allow all origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Allow credentials (cookies, authorization headers, etc)
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Hackathon Backend API')
    .setDescription('The Hackathon Backend API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3020);
}
bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TaskSeeder } from './task/task.seeder';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const seeder = app.get(TaskSeeder);

  try {
    await seeder.seed();
    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();

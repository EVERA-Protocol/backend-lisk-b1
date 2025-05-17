import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { TaskModule } from './task/task.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { UserTaskModule } from './user-task/user-task.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the config available globally
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/hackathon',
    ),
    AuthModule,
    TaskModule,
    BlockchainModule,
    UserTaskModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

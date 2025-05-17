import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserTask, UserTaskSchema } from '../schemas/user-task.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { Task, TaskSchema } from '../schemas/task.schema';
import { UserTaskService } from './user-task.service';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserTask.name, schema: UserTaskSchema },
      { name: User.name, schema: UserSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
    BlockchainModule,
  ],
  providers: [UserTaskService],
  exports: [UserTaskService],
})
export class UserTaskModule {}

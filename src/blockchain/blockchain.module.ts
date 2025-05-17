import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserTask, UserTaskSchema } from '../schemas/user-task.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { Task, TaskSchema } from '../schemas/task.schema';

@Module({
  providers: [BlockchainService],
  exports: [BlockchainService],
  imports: [
    MongooseModule.forFeature([
      { name: UserTask.name, schema: UserTaskSchema },
      { name: User.name, schema: UserSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
  ],
})
export class BlockchainModule {}

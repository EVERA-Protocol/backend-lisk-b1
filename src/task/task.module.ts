import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from '../schemas/task.schema';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { TaskSeeder } from './task.seeder';
import { UserTaskModule } from '../user-task/user-task.module';
import { UserTask, UserTaskSchema } from '../schemas/user-task.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: UserTask.name, schema: UserTaskSchema },
    ]),
    UserTaskModule,
  ],
  controllers: [TaskController],
  providers: [TaskService, TaskSeeder],
  exports: [TaskSeeder],
})
export class TaskModule {}

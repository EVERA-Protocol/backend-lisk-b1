import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from '../schemas/task.schema';

@Injectable()
export class TaskService {
  constructor(@InjectModel(Task.name) private taskModel: Model<TaskDocument>) {}

  async findAll(): Promise<Task[]> {
    return this.taskModel.find().exec();
  }

  async create(task: Partial<Task>): Promise<Task> {
    const newTask = new this.taskModel(task);
    return newTask.save();
  }

  // Boilerplate for apply to task - to be implemented
  async applyForTask(taskId: string, userId: string): Promise<any> {
    // TODO: Implement task application logic
    // throw new Error('Not implemented');
    return {
      message: `hihi ${taskId} ${userId}`,
    };
  }
}

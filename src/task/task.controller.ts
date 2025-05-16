import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { TaskService } from './task.service';
import { Task } from '../schemas/task.schema';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

interface JwtUser {
  userId: string;
  address: string;
}

class CreateTaskDto {
  title: string;
  description: string;
  deadline: string;
  tags: string[];
}

class ApplyTaskDto {
  taskId: string;
}

@ApiTags('tasks')
@Controller('tasks')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiResponse({ status: 200, description: 'Returns all tasks', type: [Task] })
  async findAll(): Promise<Task[]> {
    return this.taskService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({
    status: 201,
    description: 'Task created successfully',
    type: Task,
  })
  async create(@Body() createTaskDto: CreateTaskDto): Promise<Task> {
    return this.taskService.create(createTaskDto);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Apply for a task' })
  @ApiResponse({ status: 200, description: 'Applied for task successfully' })
  async applyForTask(
    @Body() applyTaskDto: ApplyTaskDto,
    @Req() request: Request & { user: JwtUser },
  ) {
    const user: JwtUser = request.user;

    console.log('user', user);

    return this.taskService.applyForTask(
      applyTaskDto.taskId,
      request.user.userId,
    );
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { Task } from '../schemas/task.schema';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { UserTaskService } from '../user-task/user-task.service';
import { UserTask } from '../schemas/user-task.schema';

interface JwtUser {
  userId: string;
  address: string;
}

class CreateTaskDto {
  title: string;
  description: string;
  deadline: number;
  tags: string[];
}

class ApplyTaskDto {
  @ApiProperty({ description: 'rwa token address', required: true })
  tokenAddress: string;
}

@ApiTags('tasks')
@Controller('tasks')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly userTaskService: UserTaskService,
  ) {}

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

  @Post('/:taskId/apply')
  @ApiOperation({ summary: 'Apply for a task' })
  @ApiParam({ name: 'taskId', description: 'Task ID', type: String })
  @ApiBody({ type: ApplyTaskDto })
  @ApiResponse({ status: 200, description: 'Applied for task successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async applyForTask(
    @Param('taskId') taskId: string,
    @Body() applyTaskDto: ApplyTaskDto,
    @Req() request: Request & { user: JwtUser },
  ) {
    if (!taskId) {
      throw new BadRequestException('Task ID is required');
    }

    if (!applyTaskDto.tokenAddress) {
      throw new BadRequestException('Token address is required');
    }

    return this.userTaskService.applyForTask(
      taskId,
      request.user.userId,
      applyTaskDto.tokenAddress,
    );
  }

  @Get('/user/tasks')
  @ApiOperation({ summary: 'Get all tasks applied by the current user' })
  @ApiResponse({
    status: 200,
    description: 'Returns all tasks applied by the user',
    type: [UserTask],
  })
  async getUserTasks(
    @Req() request: Request & { user: JwtUser },
  ): Promise<UserTask[]> {
    return this.userTaskService.getUserTasks(request.user.userId);
  }
}

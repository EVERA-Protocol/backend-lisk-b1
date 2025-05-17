import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UserTask,
  UserTaskDocument,
  UserTaskStatus,
} from '../schemas/user-task.schema';
import { Task, TaskDocument } from '../schemas/task.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ethers } from 'ethers';

@Injectable()
export class UserTaskService {
  private readonly logger = new Logger(UserTaskService.name);

  constructor(
    @InjectModel(UserTask.name) private userTaskModel: Model<UserTaskDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private blockchainService: BlockchainService,
  ) {
    // Subscribe to blockchain events
    this.subscribeToBlockchainEvents();
  }

  private subscribeToBlockchainEvents() {
    this.blockchainService.subscribeToTaskCreatedEvents();

    this.blockchainService.subscribeToTaskCompletedEvents();
  }

  async applyForTask(
    taskId: string,
    userId: string,
    tokenAddress: string,
  ): Promise<UserTask> {
    // Validate task exists
    const task = await this.taskModel.findById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Validate user exists
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const rwaType = 'rwa';

    // Check if user already applied for this task
    const existingApplication = await this.userTaskModel.findOne({
      user: new Types.ObjectId(userId),
      task: new Types.ObjectId(taskId),
      rwaTokenAddress: tokenAddress,
      chainId: process.env.BLOCKCHAIN_CHAIN_ID,
    });

    // Create unique task hash
    // Pack the data in the same order and format as the Solidity function
    const avsDL = Date.now() + task.deadline * 24 * 60 * 60 * 1000;
    const encodedData = ethers.solidityPacked(
      ['address', 'uint256', 'address', 'string'],
      [user.address, avsDL, tokenAddress, rwaType],
    );

    // Hash the encoded data with keccak256
    const taskHash = ethers.keccak256(encodedData);

    // console.log(`Task hash: ${encodedData}`);
    // console.log(`Task hash: ${taskHash}`);

    if (existingApplication) {
      throw new BadRequestException('You have already applied for this task');
    }

    // get latest task id
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const currTaskIdBigInt = await this.blockchainService.getLatestTaskId();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const newTaskId = parseInt(currTaskIdBigInt.toString()) + 1;

    // Create user task entry
    const userTask = new this.userTaskModel({
      user: userId,
      task: taskId,
      status: UserTaskStatus.PENDING,
      avsTaskHash: taskHash,
      metadata: {
        tokenAddress,
      },
      rwaTokenAddress: tokenAddress,
      chainId: process.env.BLOCKCHAIN_CHAIN_ID,
      avsTaskId: newTaskId,
      // avsDeadline: avsDL,
    });

    // Save user task
    await userTask.save();

    try {
      // Submit to blockchain

      const result = await this.blockchainService.createTask(
        user.address,
        task.deadline,
        tokenAddress,
        rwaType,
      );

      // Update user task with blockchain data
      userTask.taskCreationTxHash = result?.receipt?.hash;
      await userTask.save();

      console.log(
        `Task application created and submitted to blockchain: ${result?.receipt?.hash}`,
      );
    } catch (error) {
      // Update status but keep the record
      userTask.status = UserTaskStatus.REJECTED;
      userTask.reasonMessage = `Blockchain submission failed: ${error}`;
      await userTask.save();

      console.error(`Failed to submit task to blockchain: ${error}`);
      throw new BadRequestException(
        `Failed to submit task to blockchain: ${error}`,
      );
    }

    return userTask;
  }

  async getUserTasks(userId: string): Promise<UserTask[]> {
    // Check if user exists
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Find all tasks for this user and populate the task details
    const userTasks = await this.userTaskModel
      .find({ user: new Types.ObjectId(userId) })
      .populate('task')
      .sort({ createdAt: -1 })
      .exec();

    // Calculate time left for each task
    const now = Date.now();
    return userTasks.map((userTask) => {
      const task = userTask.toObject();

      // Add time left in seconds if deadline exists
      if (task.avsDeadline) {
        const deadlineTime = new Date(task.avsDeadline).getTime();
        task['timeLeftSeconds'] = Math.max(
          0,
          Math.floor((deadlineTime - now) / 1000),
        );
      } else {
        task['timeLeftSeconds'] = null;
      }

      return task;
    });
  }
}

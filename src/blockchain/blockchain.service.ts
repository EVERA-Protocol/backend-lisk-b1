import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import * as avsAbi from '../abi/avs.json';
import { InjectModel } from '@nestjs/mongoose';
import {
  UserTask,
  UserTaskDocument,
  UserTaskStatus,
} from 'src/schemas/user-task.schema';
import { Task, TaskDocument } from 'src/schemas/task.schema';
import { User, UserDocument } from 'src/schemas/user.schema';
import { Model } from 'mongoose';

@Injectable()
export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private adminWallet: ethers.Wallet;
  private avsContract: ethers.Contract;
  private readonly logger = new Logger(BlockchainService.name);

  constructor(
    @InjectModel(UserTask.name) private userTaskModel: Model<UserTaskDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    this.initializeBlockchain();
  }

  private initializeBlockchain() {
    try {
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC);

      // Initialize admin wallet
      this.adminWallet = new ethers.Wallet(
        process.env.ADMIN_PRIVATE_KEY || '',
        this.provider,
      );

      // Initialize AVS contract
      this.avsContract = new ethers.Contract(
        process.env.AVS_CONTRACT || '',
        avsAbi,
        this.adminWallet,
      );

      this.logger.log('Blockchain service initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize blockchain service: ${error}`);
    }
  }
  async estimateGas(txRequest: ethers.TransactionRequest) {
    const gasPrice = await this.provider
      .getFeeData()
      .then((feeData) => feeData.gasPrice);
    const gasLimit = await this.provider.estimateGas(txRequest);

    return (
      parseInt(gasPrice?.toString() ?? '0') *
      parseInt(gasLimit.toString() ?? '0')
    );
  }

  async getLatestTaskId() {
    const latestTaskId = await this.avsContract.latestTaskNum();
    return latestTaskId;
  }

  async createTask(
    asignee: string,
    deadlineInDays: number,
    rwaTokenAddress: string,
    assetType: string,
  ) {
    try {
      // Convert days to seconds and add to current timestamp
      const deadlineTimestamp =
        Date.now() + deadlineInDays * 24 * 60 * 60 * 1000;

      // get current task id and increment it
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const currentTaskId = await this.avsContract.latestTaskNum();

      // Call the createTask function on the AVS contract

      const txRequest = await this.avsContract.createTask.populateTransaction(
        asignee,
        `${deadlineTimestamp}`,
        rwaTokenAddress,
        assetType,
      );

      // doing gas estimation
      const gasEstimation = await this.estimateGas({
        ...txRequest,
        from: this.adminWallet.address,
      });

      const balance = await this.provider.getBalance(this.adminWallet.address);

      if (balance < gasEstimation) {
        throw new BadRequestException(
          `Insufficient balance ${ethers.formatEther(balance)} for gas ${ethers.formatEther(gasEstimation)}`,
        );
      }

      // Wait for transaction to be mined
      const tx = await this.adminWallet.sendTransaction(txRequest);

      this.logger.log(`Task created on blockchain with tx hash: ${tx.hash}`);
      const receipt = await tx.wait();

      this.logger.debug(`Transaction mined: ${receipt?.hash}`);

      return {
        receipt,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        currentTaskId: currentTaskId,
      };
    } catch (error) {
      this.logger.error(`Failed to create task on blockchain: ${error}`);
      throw new Error(`Blockchain transaction failed: ${error}`);
    }
  }

  // Method to listen for TaskCreated events
  subscribeToTaskCreatedEvents() {
    try {
      // Listen for events
      void this.avsContract.on(
        'TaskCreated',
        (taskId, taskHash, operator, deadline) => {
          this.logger.log(
            `TaskCreated event received: taskId=${taskId}, operator=${operator}`,
          );

          console.log(`type of deadline is ${typeof deadline}`);

          const process = async () => {
            try {
              // Find user task by taskHash
              console.log(`taskId: ${taskId}`);
              console.log(
                'type of taskId: ',
                typeof taskId,
                taskId.toString(),
                parseInt(taskId.toString()),
              );

              const userTask = await this.userTaskModel.findOne({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                avsTaskId: taskId.toString().trim(),
              });

              console.log(`userTask: ${userTask}`);

              if (!userTask) {
                console.log(
                  `Received TaskCreated event for unknown task hash: ${taskHash}`,
                );
                return;
              }

              // Update user task with blockchain data
              const now = Date.now();
              await this.userTaskModel.updateOne(
                { _id: userTask._id },
                {
                  avsTaskId: taskId,
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                  avsDeadline: new Date(parseInt(deadline.toString())), // Convert from Unix timestamp
                  taskCreationTxHash: taskHash,
                  status: UserTaskStatus.IN_PROGRESS,
                  startedAt: new Date(now),
                },
              );

              console.log(
                `Updated user task ${userTask.id} with blockchain data from event`,
              );
            } catch (error) {
              console.error(`Error processing TaskCreated event: ${error}`);
            }
          };

          process().then(() => {
            this.logger.log('TaskCreated event processed successfully');
          });
        },
      );

      this.logger.log('Subscribed to TaskCreated events');

      return true;
    } catch (error) {
      this.logger.error(`Failed to subscribe to TaskCreated events: ${error}`);
      return false;
    }
  }

  subscribeToTaskCompletedEvents() {
    try {
      // Listen for events
      this.avsContract.on(
        'TaskCompleted',
        (taskId, taskHash, operator, status) => {
          this.logger.log(
            `TaskCreated event received: taskId=${taskId}, operator=${operator}`,
          );

          console.log(`type of status is ${typeof status}`);

          const process = async () => {
            try {
              console.log(
                `Received TaskCompleted event: taskId=${taskId}, taskHash=${taskHash}, status=${status}`,
              );

              // Find user task by taskHash
              const userTask = await this.userTaskModel.findOne({
                avsTaskHash: taskHash,
              });

              if (!userTask) {
                console.log(
                  `Received TaskCompleted event for unknown task hash: ${taskHash}`,
                );
                return;
              }

              // Update user task with blockchain data
              await this.userTaskModel.updateOne(
                { _id: userTask._id },
                {
                  avsTaskId: taskId,
                  status: UserTaskStatus.COMPLETED,
                  submittedAt: new Date(),
                  completedAt: new Date(),
                  reasonMessage: status,
                },
              );
            } catch (error) {
              console.error(`Error processing TaskCompleted event: ${error}`);
            }
          };

          process().then(() => {
            this.logger.log('TaskCompleted event processed successfully');
          });
        },
      );

      this.logger.log('Subscribed to TaskCreated events');
      return true;
    } catch (error) {
      this.logger.error(`Failed to subscribe to TaskCreated events: ${error}`);
      return false;
    }
  }
}

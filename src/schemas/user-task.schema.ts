import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.schema';
import { Task } from './task.schema';

export enum UserTaskStatus {
  PENDING = 'PENDING', // Initial state when user applies
  APPROVED = 'APPROVED', // Task application approved
  REJECTED = 'REJECTED', // Task application rejected
  IN_PROGRESS = 'IN_PROGRESS', // User is working on the task
  SUBMITTED = 'SUBMITTED', // User has submitted the work
  COMPLETED = 'COMPLETED', // Task verified and completed
  DISPUTED = 'DISPUTED', // Task is under dispute
  SLASHED = 'SLASHED', // User was slashed for misconduct
  CANCELLED = 'CANCELLED', // Task was cancelled
}

export type UserTaskDocument = UserTask & Document;

@Schema({ timestamps: true })
export class UserTask {
  @ApiProperty({ description: 'Reference to the user' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @ApiProperty({ description: 'Reference to the task' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Task', required: true })
  task: Task;

  @ApiProperty({ description: 'rwa token address' })
  @Prop({ type: MongooseSchema.Types.String, required: true })
  rwaTokenAddress: string;

  @ApiProperty({ description: 'chainId' })
  @Prop({ type: MongooseSchema.Types.String, required: true })
  chainId: string;

  @ApiProperty({ description: 'Current status of the user task' })
  @Prop({
    type: String,
    enum: UserTaskStatus,
    default: UserTaskStatus.PENDING,
  })
  status: UserTaskStatus;

  @ApiProperty({ description: 'Task creation transaction hash' })
  @Prop()
  taskCreationTxHash?: string;

  @ApiProperty({ description: 'Task completion transaction hash' })
  @Prop()
  taskCompletionTxHash?: string;

  @ApiProperty({ description: 'Slashing transaction hash if applicable' })
  @Prop()
  slashingTxHash?: string;

  @ApiProperty({ description: 'On-chain task ID from AVS contract' })
  @Prop()
  avsTaskId?: string;

  @ApiProperty({ description: 'Task hash from AVS contract' })
  @Prop()
  avsTaskHash?: string;

  @ApiProperty({ description: 'Deadline timestamp from AVS contract' })
  @Prop()
  avsDeadline?: Date;

  @ApiProperty({
    description: 'Verification result data (could be IPFS hash or direct data)',
  })
  @Prop({ type: MongooseSchema.Types.Mixed })
  verificationData?: any;

  @ApiProperty({ description: 'Any additional metadata for the task' })
  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: any;

  @ApiProperty({ description: 'Reason if task was rejected or disputed' })
  @Prop()
  reasonMessage?: string;

  @ApiProperty({ description: 'Amount of tokens staked for this task' })
  @Prop()
  stakedAmount?: string;

  @ApiProperty({ description: 'Amount of rewards earned from this task' })
  @Prop()
  rewardAmount?: string;

  @ApiProperty({ description: 'Amount slashed if any' })
  @Prop()
  slashedAmount?: string;

  @ApiProperty({ description: 'When the task was started' })
  @Prop()
  startedAt?: Date;

  @ApiProperty({ description: 'When the task was submitted' })
  @Prop()
  submittedAt?: Date;

  @ApiProperty({ description: 'When the task was completed/verified' })
  @Prop()
  completedAt?: Date;
}

export const UserTaskSchema = SchemaFactory.createForClass(UserTask);

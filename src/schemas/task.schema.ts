import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type TaskDocument = Task & Document;

@Schema({ timestamps: true })
export class Task {
  @ApiProperty({ description: 'Title of the task' })
  @Prop({ required: true })
  title: string;

  @ApiProperty({ description: 'Description of the task' })
  @Prop({ required: true })
  description: string;

  @ApiProperty({ description: 'Deadline in N days' })
  @Prop({ required: true })
  deadline: number;

  @ApiProperty({ description: 'Array of tags for the task' })
  @Prop({ type: [String], default: [] })
  tags: string[];
}

export const TaskSchema = SchemaFactory.createForClass(Task);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @ApiProperty({ description: 'Ethereum wallet address of the user' })
  @Prop({ required: true, unique: true, index: true })
  address: string;

  @ApiProperty({ description: 'Nonce used for authentication' })
  @Prop({ required: true })
  nonce: string;

  @ApiProperty({ description: 'Whether the user is banned' })
  @Prop({ default: false })
  isBanned: boolean;

  @ApiProperty({ description: 'Reason for ban if applicable' })
  @Prop({ default: null })
  banReason?: string;

  @ApiProperty({ description: 'Last login timestamp' })
  @Prop()
  lastLogin?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

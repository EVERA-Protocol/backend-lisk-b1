import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import { ethers } from 'ethers';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async generateNonce(address: string): Promise<{ nonce: string }> {
    // Generate a random nonce
    const nonce = crypto.randomBytes(32).toString('hex');

    // Find user or create if doesn't exist
    await this.userModel.findOneAndUpdate(
      { address: address.toLowerCase() },
      {
        address: address.toLowerCase(),
        nonce,
      },
      { upsert: true, new: true },
    );

    return { nonce };
  }

  async verifySignature(
    address: string,
    signature: string,
    message: string,
  ): Promise<{ token: string }> {
    const user = await this.userModel.findOne({
      address: address.toLowerCase(),
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.isBanned) {
      throw new ForbiddenException(user.banReason || 'Account is banned');
    }

    // Verify the signature
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);

      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        throw new UnauthorizedException('Invalid signature');
      }

      // Generate new nonce for next login
      const newNonce = crypto.randomBytes(32).toString('hex');

      // Update user's nonce and last login
      await this.userModel.updateOne(
        { _id: user._id },
        {
          nonce: newNonce,
          lastLogin: new Date(),
        },
      );

      // Generate JWT token
      const token = this.jwtService.sign({
        sub: user._id,
        address: user.address,
      });

      return { token };
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Invalid signature');
    }
  }

  async banUser(address: string, reason: string): Promise<User> {
    const user = await this.userModel.findOneAndUpdate(
      { address: address.toLowerCase() },
      {
        isBanned: true,
        banReason: reason,
      },
      { new: true },
    );

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async unbanUser(address: string): Promise<User> {
    const user = await this.userModel.findOneAndUpdate(
      { address: address.toLowerCase() },
      {
        isBanned: false,
        banReason: null,
      },
      { new: true },
    );

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}

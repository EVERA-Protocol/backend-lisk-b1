import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

class AuthRequestDto {
  address: string;
  signature: string;
  message: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('nonce')
  @ApiOperation({ summary: 'Get nonce for wallet address' })
  @ApiQuery({
    name: 'address',
    required: true,
    description: 'Ethereum wallet address',
  })
  @ApiResponse({ status: 200, description: 'Returns nonce for signing' })
  async getNonce(@Query('address') address: string) {
    if (!address) {
      throw new UnauthorizedException('Address is required');
    }
    return this.authService.generateNonce(address);
  }

  @Post()
  @ApiOperation({ summary: 'Verify signature and authenticate user' })
  @ApiBody({ type: AuthRequestDto })
  @ApiResponse({ status: 200, description: 'Returns JWT token' })
  @ApiResponse({
    status: 401,
    description: 'Invalid signature or user not found',
  })
  @ApiResponse({ status: 403, description: 'User is banned' })
  async authenticate(@Body() authRequest: AuthRequestDto) {
    const { address, signature, message } = authRequest;
    return this.authService.verifySignature(address, signature, message);
  }
}

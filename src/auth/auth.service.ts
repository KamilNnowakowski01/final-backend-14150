import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from './role.enum';

import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    // Client for regular auth operations
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL') ?? '',
      this.configService.get<string>('SUPABASE_ANON_KEY') ?? '',
    );

    // Admin client for privileged operations (like deleting users)
    this.supabaseAdmin = createClient(
      this.configService.get<string>('SUPABASE_URL') ?? '',
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  async updateSettings(userId: string, settings: UpdateSettingsDto) {
    const updateData: Partial<User> = {};

    if (settings.dailyNewLimit !== undefined) {
      updateData.dailyNewLimit = settings.dailyNewLimit;
    }
    if (settings.dailyReviewLimit !== undefined) {
      updateData.dailyReviewLimit = settings.dailyReviewLimit;
    }
    if (settings.learningStrategy !== undefined) {
      updateData.learningStrategy = settings.learningStrategy;
    }

    await this.usersRepository.update(userId, updateData);
    return { message: 'Settings updated successfully' };
  }

  async register(registerDto: RegisterDto) {
    const { email, password, name, surname } = registerDto;

    // 1. Create user in Supabase Auth
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!data.user) {
      throw new BadRequestException('User creation failed');
    }

    // 2. Create user in local database linked by ID
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const role = email === adminEmail ? Role.Admin : Role.User;

    const newUser = this.usersRepository.create({
      id: data.user.id, // Important: Link by UUID
      email,
      name,
      surname,
      role,
    });

    await this.usersRepository.save(newUser);

    return {
      message: 'User registered successfully',
      user: newUser,
    };
  }

  async deleteAccount(userId: string): Promise<{ message: string }> {
    // 1. Delete user from Supabase Auth (requires service_role key)
    const { error: authError } = await this.supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      throw new BadRequestException(`Failed to delete user from auth: ${authError.message}`);
    }

    // 2. Delete user from local database (cascade will handle related records)
    await this.usersRepository.delete(userId);

    return { message: 'Account successfully deleted' };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user,
    };
  }

  async refreshToken(refreshToken: string) {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return {
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      created_at: user.createdAt.toISOString(),
    };
  }
}

// src/supabase/supabase.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'SUPABASE_CLIENT',
      useFactory: (configService: ConfigService) => {
        return createClient(
          configService.get<string>('SUPABASE_URL')!,
          configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          },
        );
      },
      inject: [ConfigService],
    },
  ],
  exports: ['SUPABASE_CLIENT'],
})
export class SupabaseModule {}
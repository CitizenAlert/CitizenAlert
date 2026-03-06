import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HazardsModule } from './modules/hazards/hazards.module';
import { StorageModule } from './modules/storage/storage.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { dataSourceOptions } from './config/data-source';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      autoLoadEntities: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
    }),
    StorageModule,
    AuthModule,
    UsersModule,
    HazardsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

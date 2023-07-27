import { Module } from "@nestjs/common";
import controllers from "./controllers";
import commands from "./commands";
import { EnvModule } from "../env/env.module";
import { ProviderFactoryService } from "./provider-factory.service";
import { Connection, Repository } from "typeorm";
import { FactoryEntity, GameEntity, GamePlayerEntity, GameStepEntity } from "./entities";
import { DatabaseModule } from "../database/database.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { createClient } from "redis";
import { NotificationService } from "./notification.service";

const entities = TypeOrmModule.forFeature([GameEntity, GamePlayerEntity]);

@Module({
  imports: [entities, EnvModule, DatabaseModule],
  controllers,
  providers: [
    ...commands,
    NotificationService,
    {
      provide: ProviderFactoryService,
      useFactory: async (configService: ConfigService, factoryRepository: Repository<FactoryEntity>) => {
        const factory = new ProviderFactoryService(configService, factoryRepository);
        await factory.init();
        return factory;
      },
      inject: [ConfigService, "FACTORY_REPOSITORY"],
    },
    {
      provide: "GAME_REPOSITORY",
      useFactory: (connection: Connection) => connection.getRepository(GameEntity),
      inject: ["DATABASE_CONNECTION"],
    },
    {
      provide: "GAME_PLAYER_REPOSITORY",
      useFactory: (connection: Connection) => connection.getRepository(GamePlayerEntity),
      inject: ["DATABASE_CONNECTION"],
    },
    {
      provide: "GAME_STEP_REPOSITORY",
      useFactory: (connection: Connection) => connection.getRepository(GameStepEntity),
      inject: ["DATABASE_CONNECTION"],
    },
    {
      provide: "FACTORY_REPOSITORY",
      useFactory: (connection: Connection) => connection.getRepository(FactoryEntity),
      inject: ["DATABASE_CONNECTION"],
    },
    {
      provide: "REDIS_CLIENT",
      useFactory: async (configService: ConfigService) => {
        const redisClient = createClient({
          url: `redis://:${configService.get("REDIS_PASSWORD")}@${configService.get("REDIS_HOST")}:${configService.get("REDIS_PORT")}`,
        });
        await redisClient.connect();
        return redisClient;
      },
      inject: [ConfigService],
    },
  ],
  exports: [entities],
})
export class GameModule {}

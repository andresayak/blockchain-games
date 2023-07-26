import { Command, Positional } from "nestjs-command";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ProviderFactoryService } from "../provider-factory.service";
import { Contract, Provider } from "ethers";
import * as TicTacToeERC20 from "../../contracts/TicTacToeERC20.sol/TicTacToeERC20.json";
import * as Factory from "../../contracts/Factory.sol/Factory.json";
import { IsNull, Repository } from "typeorm";
import { FactoryEntity, GameEntity, GamePlayerEntity, GameStepEntity, Statuses } from "../entities";
import { RedisClientType } from "redis";

type PropsType = {
  provider: Provider;
  chainId: number;
};

@Injectable()
export class ScanBlocksCommand {
  lastProcessBlock: number;

  constructor(
    private readonly configService: ConfigService,
    @Inject("GAME_REPOSITORY")
    private readonly gameRepository: Repository<GameEntity>,
    @Inject("GAME_PLAYER_REPOSITORY")
    private readonly gamePlayerRepository: Repository<GamePlayerEntity>,
    @Inject("GAME_STEP_REPOSITORY")
    private readonly gameStepRepository: Repository<GameStepEntity>,
    @Inject("FACTORY_REPOSITORY")
    private readonly factoryRepository: Repository<FactoryEntity>,
    private readonly providerFactoryService: ProviderFactoryService,
    @Inject("REDIS_CLIENT")
    private readonly redisClient: RedisClientType,
  ) {}

  @Command({
    command: "scan:games <chainId>",
  })
  async create(
    @Positional({
      name: "chainId",
      type: "number",
    })
    chainId: number,
  ) {
    const providerWs = this.providerFactoryService.create(chainId, "ws");
    const providerHttp = this.providerFactoryService.create(chainId, "http");

    if (
      !(await this.factoryRepository.countBy({
        chainId,
      }))
    ) {
      throw Error(`Not found factories for this chain [chainId = ${chainId}]`);
    }
    await this.saveBirthdayBlock({ chainId, provider: providerHttp });

    const lastBlock = await this.lastBlock(chainId);
    let currentBlock = await providerHttp.getBlockNumber();
    console.log("currentBlock", currentBlock);
    this.lastProcessBlock = 0;
    const liveCount = 0;
    let syncOld = false;

    // eslint-disable-next-line no-async-promise-executor
    new Promise(async done => {
      for (let blockNumber = lastBlock; blockNumber <= currentBlock; blockNumber++) {
        await this.processBlock(blockNumber, { chainId, provider: providerHttp });
      }
      console.log("Synced old!");
      syncOld = true;
      done(true);
    });

    await providerWs.on("block", blockNumber => {
      currentBlock = blockNumber;
      const timeStart = new Date();
      const used = process.memoryUsage().heapUsed / 1024 / 1024;
      console.log(timeStart, ` --------- new block [${blockNumber}] live blocks: ${liveCount} memory ${Math.round(used * 100) / 100} MB`);
      if (syncOld && blockNumber > this.lastProcessBlock) {
        this.processBlock(blockNumber, { chainId, provider: providerHttp });
      }
    });
  }

  async saveBirthdayBlock(props: PropsType) {
    const { chainId, provider } = props;
    const factories = await this.factoryRepository.find({
      where: {
        chainId,
        blockNumber: IsNull(),
      },
    });
    for (const factory of factories) {
      const factoryContract = new Contract(factory.address, Factory.abi, provider);
      const blockNumber = await factoryContract.birthdayBlock();
      factory.fill({
        blockNumber,
      });
      await this.factoryRepository.save(factory);
    }
  }

  async processBlock(blockNumber: number, props: PropsType) {
    console.log("processBlock", blockNumber);
    const { chainId, provider } = props;

    const logs = await provider.getLogs({
      fromBlock: blockNumber,
      toBlock: blockNumber,
    });

    for (const log of logs) {
      const factory = await this.factoryRepository.findOne({
        where: {
          chainId,
          address: log.address,
        },
      });
      if (factory) {
        const factoryContract = new Contract(factory.address, Factory.abi, provider);
        const fragment = factoryContract.interface.getEvent(log.topics[0]);
        const args = factoryContract.interface.decodeEventLog(fragment, log.data, log.topics);
        console.log("factoryLog", fragment, args);
        if (fragment) {
          if (fragment.name == "GameCreated") {
            await this.saveNewGame(args[0], args[1], factory.address, blockNumber, log.transactionHash, props);
          }
        }
      }
      const game = await this.gameRepository.findOne({
        where: {
          chainId,
          address: log.address,
        },
      });
      if (game) {
        const gameContract = new Contract(game.address, TicTacToeERC20.abi, provider);
        const fragment = gameContract.interface.getEvent(log.topics[0]);
        const args = gameContract.interface.decodeEventLog(fragment, log.data, log.topics);
        if (fragment) {
          if (fragment.name == "GameStart") {
            await this.saveStartGame(args[0], game, Statuses.PROGRESS);
          }
          if (fragment.name == "GameEnded") {
            await this.saveEndGame(game);
          }
          if (fragment.name == "GameStep") {
            await this.saveStepGame(blockNumber, log.transactionHash, args, game);
          }
        }
      }
    }
    this.lastProcessBlock = blockNumber;
  }

  async saveEndGame(game: GameEntity) {
    const newStatus = Statuses.FINISHED;
    if (game.status !== newStatus) {
      await this.gameRepository.update(
        {
          id: game.id,
        },
        {
          status: newStatus,
        },
      );
    }
  }

  async saveStartGame(player2: string, game: GameEntity, newStatus: Statuses) {
    try {
      await this.gamePlayerRepository.save({
        gameId: game.id,
        address: player2,
      });
    } catch (e) {
      if (e && e.toString().match(/duplicate key value violates unique constraint/)) {
        return;
      } else {
        throw e;
      }
    }
    if (game.status !== newStatus) {
      await this.gameRepository.update(
        {
          id: game.id,
        },
        {
          status: newStatus,
        },
      );
    }
  }

  async saveStepGame(blockNumber: number, transactionHash: string, args: any, game: GameEntity) {
    await this.gameStepRepository.save({
      gameId: game.id,
      blockNumber,
      transactionHash: transactionHash,
      params: args,
      createdAt: new Date(),
    });
  }

  async lastBlock(chainId: number) {
    const lastBlock = await this.redisClient.get("lastBlock");
    const number = parseInt(lastBlock);
    if (number) {
      return number;
    }
    const result = await this.factoryRepository
      .createQueryBuilder()
      .select("MIN(block_number)", "minimum")
      .where({
        chainId,
      })
      .getRawOne();

    if (result) {
      return result.minimum;
    }
    throw Error("not have minimum");
  }

  async saveNewGame(gameAddress: string, creatorAddress: string, factoryAddress: string, blockNumber: number, transactionHash: string, props: PropsType) {
    const { provider, chainId } = props;
    const gameContract = new Contract(gameAddress, TicTacToeERC20.abi, provider);

    const tokenAddress = await gameContract.token();
    const timeoutTime = await gameContract.timeoutTime();
    const coins = await gameContract.coins();
    const size = await gameContract.size();
    const createdTime: bigint = await gameContract.createdTime();

    console.log("createdTime", createdTime);
    try {
      const game = await this.gameRepository.save({
        type: "0",
        factoryAddress: factoryAddress,
        blockNumber,
        transactionHash,
        chainId,
        address: gameAddress,
        tokenAddress,
        creatorAddress,
        status: Statuses.WAIT,
        params: {
          timeoutTime: timeoutTime.toString(),
          coins: coins.toString(),
          size: size.toString(),
        },
        createdAt: new Date(Number(createdTime) * 1000),
      });

      console.log("game", game);
      await this.gamePlayerRepository.save({
        gameId: game.id,
        address: creatorAddress,
      });
    } catch (e) {
      if (e && e.toString().match(/duplicate key value violates unique constraint/)) {
        return;
      } else {
        throw e;
      }
    }

    console.log("game", {
      tokenAddress,
      timeoutTime,
      coins,
      size,
      createdTime,
    });
  }
}

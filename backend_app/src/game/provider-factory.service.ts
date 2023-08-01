import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BSC, BSCTestnet, Hardhat } from "../chains";
import { ethers } from "ethers";
import { Repository } from "typeorm";
import { FactoryEntity } from "./entities";

@Injectable()
export class ProviderFactoryService {
  public chains: {
    [k: number]: {
      providerHttpUrl: string;
      providerWsUrl: string;
      publicConfig: { [k: string]: string };
    };
  } = {};
  constructor(
    private readonly configService: ConfigService,
    @Inject("FACTORY_REPOSITORY")
    private readonly factoryRepository: Repository<FactoryEntity>,
  ) {
    this.chains = {
      [BSC.chainId]: {
        providerHttpUrl: this.configService.get("BSCMAINNET_PROVIDER_HTTP_URL"),
        providerWsUrl: this.configService.get("BSCMAINNET_PROVIDER_WS_URL"),
        publicConfig: {
          FACTORY_ADDRESS: this.configService.get("FACTORY_ADDRESS_BSC"),
        },
      },
      [BSCTestnet.chainId]: {
        providerHttpUrl: this.configService.get("BSCTESTNET_PROVIDER_HTTP_URL"),
        providerWsUrl: this.configService.get("BSCTESTNET_PROVIDER_WS_URL"),
        publicConfig: {
          FACTORY_ADDRESS: this.configService.get("FACTORY_ADDRESS_BSCTESTNET"),
        },
      },
      [Hardhat.chainId]: {
        providerHttpUrl: this.configService.get("HARDHAT_PROVIDER_HTTP_URL"),
        providerWsUrl: this.configService.get("HARDHAT_PROVIDER_WS_URL"),
        publicConfig: {
          FACTORY_ADDRESS: this.configService.get("FACTORY_ADDRESS_HARDHAT"),
        },
      },
    };
  }

  async init() {
    const factories = await this.factoryRepository.find();
    for (const factory of factories) {
      this.chains[factory.chainId].publicConfig["FACTORY_ADDRESS_" + factory.type] = factory.address;
    }
  }

  create(chainId: number, type: "ws" | "http" = "http") {
    if (!this.chains[chainId]) {
      throw Error("wrong chain");
    }
    if (type == "http") {
      return new ethers.JsonRpcProvider(this.chains[chainId].providerHttpUrl);
    }
    if (type == "ws") {
      return new ethers.WebSocketProvider(this.chains[chainId].providerWsUrl);
    }
  }
}

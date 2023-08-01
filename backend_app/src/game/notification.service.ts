import { Inject, Injectable } from "@nestjs/common";
import { Subject } from "rxjs";
import { RedisClientType } from "redis";

type NotificationMessageType = {
  chainId: number;
  address: string;
  data: any;
};

@Injectable()
export class NotificationService {
  listener: Record<string, Subject<any>> = {};

  constructor(
    @Inject("REDIS_CLIENT")
    private readonly redisClient: RedisClientType,
  ) {
    this.storageConnection();
  }

  storageConnection() {
    const subscriber = this.redisClient.duplicate();
    subscriber.connect().then(() => {
      subscriber.subscribe("game_notifications", async data => {
        try {
          const json: NotificationMessageType = JSON.parse(data);
          this.getListener(json.chainId, json.address).next({ data: json.data });
        } catch (e) {
          console.log(e);
        }
      });
    });
  }

  async handleConnection(chainId: number, address: string) {
    return this.getListener(chainId, address).asObservable();
  }

  getListener(chainId: number, address: string) {
    const id = chainId + "_" + address;
    if (!this.listener[id]) {
      this.listener[id] = new Subject();
    }
    return this.listener[id];
  }

  emit(chainId: number, address: string, data: any) {
    return this.redisClient.publish(
      "game_notifications",
      JSON.stringify(<NotificationMessageType>{
        data,
        chainId,
        address,
      }),
    );
  }
}

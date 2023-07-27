import { Injectable } from "@nestjs/common";
import { Subject } from "rxjs";

@Injectable()
export class NotificationService {
  listener: Record<string, Subject<any>> = {};

  async handleConnection(chainId: number, address: string) {
    setInterval(() => {
      this.getListener(chainId, address).next({ data: { message: "Hello World" } });
    }, 1000);
    return this.getListener(chainId, address).asObservable();
  }

  getListener(chainId: number, address: string) {
    const id = chainId + "_" + address;
    if (!this.listener[id]) {
      this.listener[id] = new Subject();
    }
    return this.listener[id];
  }
}

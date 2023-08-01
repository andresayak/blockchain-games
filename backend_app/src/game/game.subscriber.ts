import { Connection, EntitySubscriberInterface, EventSubscriber, UpdateEvent } from "typeorm";
import { GameEntity } from "./entities";
import { Inject } from "@nestjs/common";
import { InsertEvent } from "typeorm/subscriber/event/InsertEvent";
import { NotificationService } from "./notification.service";

@EventSubscriber()
export class GameSubscriber implements EntitySubscriberInterface<GameEntity> {
  constructor(@Inject("DATABASE_CONNECTION") connection: Connection, private readonly notificationService: NotificationService) {
    connection.subscribers.push(this);
  }

  listenTo() {
    return GameEntity;
  }

  afterInsert?(event: InsertEvent<GameEntity>) {
    console.log(`AFTER ENTITY INSERTED: `, event.entity);
    this.notificationService.emit(event.entity.chainId, event.entity.address, {
      type: "insert",
      game: event.entity,
    });
  }

  afterUpdate(event: UpdateEvent<GameEntity>) {
    console.log(`AFTER ENTITY UPDATED: `, event.entity);
    this.notificationService.emit(event.entity.chainId, event.entity.address, {
      type: "update",
      game: event.entity,
    });
  }
}

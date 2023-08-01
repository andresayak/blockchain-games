import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { BaseEntity } from "../../common/base.entity";
import { GameEntity } from "./game.entity";

@Entity("games_steps")
export class GameStepEntity extends BaseEntity<GameStepEntity> {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "game_id", type: "integer" })
  gameId: number;

  @Column({ name: "block_number", type: "integer" })
  blockNumber: number;

  @Column({ name: "transaction_hash", type: "varchar", length: "128" })
  transactionHash: string;

  @Column({ name: "params", type: "jsonb" })
  params: any;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    nullable: false,
  })
  createdAt: Date;

  @ManyToOne(() => GameEntity, game => game.steps)
  @JoinColumn({ name: "game_id" })
  game: Promise<GameEntity>;
}

import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { BaseEntity } from "../../common/base.entity";
import { GamePlayerEntity } from "./game-player.entity";
import { GameStepEntity } from "./game-step.entity";

export enum Statuses {
  WAIT,
  PROGRESS,
  FINISHED,
  CANCELED,
}
@Entity("games")
export class GameEntity extends BaseEntity<GameEntity> {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "type", type: "varchar", length: "128" })
  type: string;

  @Column({ name: "block_number", type: "integer" })
  blockNumber: number;

  @Column({ name: "transaction_hash", type: "varchar", length: "128" })
  transactionHash: string;

  @Column({ name: "factoryAddress", type: "varchar", length: "128" })
  factoryAddress: string;

  @Column({ name: "tokenAddress", type: "varchar", length: "128" })
  tokenAddress: string;

  @Column({ name: "creatorAddress", type: "varchar", length: "128" })
  creatorAddress: string;

  @Column({ name: "address", type: "varchar", length: "128" })
  address: string;

  @Column({ name: "params", type: "jsonb" })
  params: any;

  @Column({ name: "chainId", type: "integer" })
  chainId: number;

  @Column({ name: "status", type: "integer", default: Statuses.WAIT })
  status: Statuses;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    nullable: false,
  })
  createdAt: Date;

  @OneToMany(() => GameStepEntity, step => step.game, {
    eager: true,
  })
  @JoinColumn({ referencedColumnName: "game_id" })
  steps: Promise<GameStepEntity[]>;

  @OneToMany(() => GamePlayerEntity, player => player.game, {
    eager: true,
  })
  @JoinColumn({ referencedColumnName: "game_id" })
  players: Promise<GamePlayerEntity[]>;
}

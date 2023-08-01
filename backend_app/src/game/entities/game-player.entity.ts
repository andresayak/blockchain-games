import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { BaseEntity } from "../../common/base.entity";
import { GameEntity } from "./game.entity";

@Entity("games_players")
export class GamePlayerEntity extends BaseEntity<GamePlayerEntity> {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "game_id", type: "integer" })
  gameId: number;

  @Column({ name: "address", type: "varchar", length: "128" })
  address: string;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    nullable: false,
  })
  createdAt: Date;

  @ManyToOne(() => GameEntity, game => game.players)
  @JoinColumn({ name: "game_id" })
  game: Promise<GameEntity>;
}

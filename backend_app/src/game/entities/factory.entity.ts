import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { BaseEntity } from "../../common/base.entity";

@Entity("factories")
export class FactoryEntity extends BaseEntity<FactoryEntity> {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "block_number", type: "integer" })
  blockNumber: number;

  @Column({ name: "type", type: "varchar", length: "128" })
  type: string;

  @Column({ name: "address", type: "varchar", length: "128" })
  address: string;

  @Column({ name: "chainId", type: "integer" })
  chainId: number;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    nullable: false,
  })
  createdAt: Date;
}

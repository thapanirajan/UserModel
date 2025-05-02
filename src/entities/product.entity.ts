import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { string } from "zod";
import { Subcategory } from "./subcategory.entity";
import { User } from "./user.entity";

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column('text')
    description: string;

    @Column('decimal', { precision: 8, scale: 2 }) // max = lakh and 2 place decimal 
    price: number;

    @Column()
    stock: number;

    @Column('json', { nullable: true })
    image_urls: string[];

    @ManyToOne(() => Subcategory, (subcategory) => subcategory.products, { onDelete: "CASCADE" })
    @JoinColumn({ name: "subcategory_id" })// customize column name
    subcategory: Subcategory;

    @ManyToOne(() => User, (user) => user.products, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'vendor_id' })
    vendor: User;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

}
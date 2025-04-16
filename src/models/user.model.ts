import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"


enum AuthProvider {
    LOCAL = "local",
    FACEBOOK = "facebook",
    GOOGLE = "google",
}

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, nullable: true })
    email: string;

    @Column({ nullable: true })
    googleId?: string

    @Column({ nullable: true })
    facebookId?: string

    @Column({
        type: "enum",
        enum: AuthProvider,
        default: AuthProvider.LOCAL
    })
    provider: AuthProvider;

    @Column({ default: false })
    isVerified: Boolean

    @Column()
    password?: string

    @Column({ nullable: true })
    token?: string;

    @Column({ nullable: true })
    tokenExpire?: Date

    @Column({ default: 0, nullable: true })
    resendCount: number

    @Column({ nullable: true })
    resendBlockUntil?: Date

    @Column()
    createdAt: Date
}
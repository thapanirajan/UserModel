import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"


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
    username: string;

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
    isVerified: boolean

    @Column({ nullable: true })
    password?: string

    @Column({ nullable: true })
    verificationCode?: string; // for email verification 

    @Column({ nullable: true })
    verificationCodeExpire?: Date // for email verification 

    @Column({ nullable: true })
    resetToken?: string //for forgot password 

    @Column({ nullable: true })
    resetTokenExpire?: Date //for forgot password 

    @Column({ default: 0, nullable: true })
    resendCount: number; // Tracks number of resend attempts

    @Column({ nullable: true })
    resendBlockUntil?: Date; // Blocks resends until this time

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date;
}
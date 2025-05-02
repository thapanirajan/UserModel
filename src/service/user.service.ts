import { MoreThan } from 'typeorm';
import AppDataSource from '../config/db.config';
import { User } from '../entities/user.entity';

const userDB = AppDataSource.getRepository(User);

// Fetch all users
export const fetchAllUser = async (): Promise<User[]> => {
    return await userDB.find();
};

// Create a new user
// Partial<User> allows passing a subset of User properties
export const createUser = async (userData: Partial<User>): Promise<User> => {
    const user = userDB.create(userData);
    return await userDB.save(user);
};

// Find user by email
export const findUserByEmail = async (email: string): Promise<User | null> => {
    return await userDB.findOneBy({ email });
};

// Find user by email or username for login
export const findUserByEmailLogin = async (email: string): Promise<User | null> => {
    return await userDB.findOne({
        where: [{ email }, { username: email }],
    });
};

// Find user by reset token
export const findUserByResetToken = async (token: string): Promise<User | null> => {
    return await userDB.findOne({
        where: {
            resetToken: token,
            resetTokenExpire: MoreThan(new Date()),
        },
    });
};

// Get user by ID
export const getUserByIdService = async (id: number): Promise<User | null> => {
    return await userDB.findOneBy({ id });
};

// Update user
export const updateUserService = async (id: number, data: Partial<User>): Promise<User | null> => {
    const user = await userDB.findOneBy({ id });
    if (!user) return null;

    await userDB.update(id, data);
    return await userDB.findOneBy({ id });
};

// Save user (for direct updates)
export const saveUser = async (user: User): Promise<User> => {
    return await userDB.save(user);
};
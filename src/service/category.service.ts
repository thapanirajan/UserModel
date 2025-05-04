import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { User, UserRole } from '../entities/user.entity';
import AppDataSource from '../config/db.config';
import { CreateCategoryInput, UpdateCategoryInput } from '../utils/zod_validations/category.zod';

export class CategoryService {
    private categoryRepository: Repository<Category>;
    private userRepository: Repository<User>;

    constructor() {
        this.categoryRepository = AppDataSource.getRepository(Category);
        this.userRepository = AppDataSource.getRepository(User);
    }

    async createCategory(dto: CreateCategoryInput, userId: number): Promise<Category> {
        const user = await this.userRepository.findOne({ where: { id: userId, role: UserRole.ADMIN } });
        if (!user) {
            throw new Error('User not found or not an admin');
        }

        const category = this.categoryRepository.create({
            name: dto.name,
            createdBy: user,
        });
        return this.categoryRepository.save(category);
    }

    async getCategories(): Promise<Category[]> {
        return this.categoryRepository.find({ relations: ['subcategories', 'createdBy'] });
    }

    async getCategoryById(id: number): Promise<Category | null> {
        return this.categoryRepository.findOne({
            where: { id },
            relations: ['subcategories', 'createdBy'],
        });
    }

    async updateCategory(id: number, dto: UpdateCategoryInput, userId: number): Promise<Category | null> {
        const user = await this.userRepository.findOne({ where: { id: userId, role: UserRole.ADMIN } });
        if (!user) {
            throw new Error('User not found or not an admin');
        }

        const category = await this.categoryRepository.findOne({ where: { id } });
        if (!category) {
            throw new Error('Category not found');
        }

        await this.categoryRepository.update(id, { name: dto.name });
        return this.categoryRepository.findOne({ where: { id }, relations: ['subcategories', 'createdBy'] });
    }

    async deleteCategory(id: number, userId: number): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id: userId, role: UserRole.ADMIN } });
        if (!user) {
            throw new Error('User not found or not an admin');
        }

        const category = await this.categoryRepository.findOne({ where: { id } });
        if (!category) {
            throw new Error('Category not found');
        }

        await this.categoryRepository.delete(id);
    }
}
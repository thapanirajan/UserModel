import { Repository } from 'typeorm';
import { CreateSubcategoryDTO, UpdateSubcategoryDTO } from '../dtos/subcategory.dto';
import { Subcategory } from '../entities/subcategory.entity';
import { Category } from '../entities/category.entity';
import { User, UserRole } from '../entities/user.entity';
import AppDataSource from '../config/db.config';

export class SubcategoryService {
    private subcategoryRepository: Repository<Subcategory>;
    private categoryRepository: Repository<Category>;
    private userRepository: Repository<User>;

    constructor() {
        this.subcategoryRepository = AppDataSource.getRepository(Subcategory);
        this.categoryRepository = AppDataSource.getRepository(Category);
        this.userRepository = AppDataSource.getRepository(User);
    }

    async createSubcategory(dto: CreateSubcategoryDTO, categoryId: number, userId: number): Promise<Subcategory> {
        const category = await this.categoryRepository.findOne({ where: { id: categoryId } });
        if (!category) {
            throw new Error('Category not found');
        }

        const user = await this.userRepository.findOne({ where: { id: userId, role: UserRole.ADMIN } });
        if (!user) {
            throw new Error('User not found or not an admin');
        }

        const subcategory = this.subcategoryRepository.create({
            name: dto.name,
            createdBy: user,
            category,
        });
        return this.subcategoryRepository.save(subcategory);
    }

    async getSubcategories(categoryId: number): Promise<Subcategory[]> {
        return this.subcategoryRepository.find({
            where: { category: { id: categoryId } },
            relations: ['category', 'createdBy'],
        });
    }

    async getSubcategoryById(id: number, categoryId: number): Promise<Subcategory | null> {
        return this.subcategoryRepository.findOne({
            where: { id, category: { id: categoryId } },
            relations: ['category', 'createdBy'],
        });
    }

    async updateSubcategory(id: number, dto: UpdateSubcategoryDTO, categoryId: number, userId: number): Promise<Subcategory | null> {
        const user = await this.userRepository.findOne({ where: { id: userId, role: UserRole.ADMIN } });
        if (!user) {
            throw new Error('User not found or not an admin');
        }

        const subcategory = await this.subcategoryRepository.findOne({
            where: { id, category: { id: categoryId } },
        });
        if (!subcategory) {
            throw new Error('Subcategory not found');
        }

        await this.subcategoryRepository.update(id, { name: dto.name });
        return this.subcategoryRepository.findOne({
            where: { id, category: { id: categoryId } },
            relations: ['category', 'createdBy'],
        });
    }

    async deleteSubcategory(id: number, categoryId: number, userId: number): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id: userId, role: UserRole.ADMIN } });
        if (!user) {
            throw new Error('User not found or not an admin');
        }

        const subcategory = await this.subcategoryRepository.findOne({
            where: { id, category: { id: categoryId } },
        });
        if (!subcategory) {
            throw new Error('Subcategory not found');
        }

        await this.subcategoryRepository.delete(id);
    }
}
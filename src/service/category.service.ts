import { Repository } from 'typeorm';
import { CreateCategoryDTO } from '../dtos/CategoryDTO';
import { Category } from '../models/category.model';
import { Subcategory } from '../models/subcategory.model';
import { User } from '../models/user.model';
import AppDataSource from '../config/db.config';
import { CreateSubcategoryDTO } from '../dtos/SubCategoryDTO';


export class CategoryService {
    private categoryRepository: Repository<Category>;
    private subcategoryRepository: Repository<Subcategory>;
    private userRepository: Repository<User>;

    constructor() {
        this.categoryRepository = AppDataSource.getRepository(Category);
        this.subcategoryRepository = AppDataSource.getRepository(Subcategory);
        this.userRepository = AppDataSource.getRepository(User);
    }

    async createCategory(dto: CreateCategoryDTO): Promise<Category> {
        const user = await this.userRepository.findOne({ where: { id: dto.createdBy } });
        if (!user) {
            throw new Error('User not found');
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

    async createSubcategory(dto: CreateSubcategoryDTO): Promise<Subcategory> {
        const category = await this.categoryRepository.findOne({
            where: { id: dto.categoryId },
        });
        if (!category) {
            throw new Error('Category not found');
        }

        const user = await this.userRepository.findOne({ where: { id: dto.createdBy } });
        if (!user) {
            throw new Error('User not found');
        }

        const subcategory = this.subcategoryRepository.create({
            name: dto.name,
            createdBy: user,
            category,
        });
        return this.subcategoryRepository.save(subcategory);
    }
}
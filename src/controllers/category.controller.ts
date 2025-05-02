import { Request, Response } from 'express';
import { validate } from 'class-validator';
import { CategoryService } from '../service/category.service';
import { CreateCategoryDTO, UpdateCategoryDTO } from '../dtos/category.dto';
import { ICreateCategoryRequest, IUpdateCategoryRequest, ICategoryIdParams } from '../interface/category.interface';
import { AuthRequest } from '../middlewares/auth.middleware';

export class CategoryController {
    private categoryService: CategoryService;

    constructor() {
        this.categoryService = new CategoryService();
    }

    async createCategory(req: AuthRequest<{}, {}, ICreateCategoryRequest>, res: Response): Promise<void> {
        const dto = new CreateCategoryDTO();
        Object.assign(dto, req.body);

        const errors = await validate(dto);
        if (errors.length > 0) {
            res.status(400).json({ success: false, errors });
            return;
        }

        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const category = await this.categoryService.createCategory(dto, user.id);
            res.status(201).json({ success: true, data: category });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getCategories(req: Request, res: Response): Promise<void> {
        try {
            const categories = await this.categoryService.getCategories();
            res.status(200).json({ success: true, data: categories });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getCategoryById(req: Request<ICategoryIdParams>, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            if (isNaN(id)) {
                res.status(400).json({ success: false, message: 'Invalid category ID' });
                return;
            }

            const category = await this.categoryService.getCategoryById(id);
            if (!category) {
                res.status(404).json({ success: false, message: 'Category not found' });
                return;
            }

            res.status(200).json({ success: true, data: category });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateCategory(req: AuthRequest<ICategoryIdParams, {}, IUpdateCategoryRequest>, res: Response): Promise<void> {
        const dto = new UpdateCategoryDTO();
        Object.assign(dto, req.body);

        const errors = await validate(dto);
        if (errors.length > 0) {
            res.status(400).json({ success: false, errors });
            return;
        }

        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const id = req.params.id;
            if (isNaN(id)) {
                res.status(400).json({ success: false, message: 'Invalid category ID' });
                return;
            }

            const category = await this.categoryService.updateCategory(id, dto, user.id);
            if (!category) {
                res.status(404).json({ success: false, message: 'Category not found' });
                return;
            }

            res.status(200).json({ success: true, data: category });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async deleteCategory(req: AuthRequest<ICategoryIdParams>, res: Response): Promise<void> {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const id = req.params.id;
            if (isNaN(id)) {
                res.status(400).json({ success: false, message: 'Invalid category ID' });
                return;
            }

            await this.categoryService.deleteCategory(id, user.id);
            res.status(204).json({ success: true, message: 'Category deleted' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
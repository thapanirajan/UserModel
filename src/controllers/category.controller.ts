import { Request, Response } from 'express';
import { CategoryService } from '../service/category.service';
import { ICreateCategoryRequest, IUpdateCategoryRequest, ICategoryIdParams } from '../interface/category.interface';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createCategorySchema, updateCategorySchema } from '../utils/zod_validations/category.zod';

export class CategoryController {
    private categoryService: CategoryService;

    constructor() {
        this.categoryService = new CategoryService();
    }



    async createCategory(req: AuthRequest<{}, {}, ICreateCategoryRequest>, res: Response): Promise<void> {
        try {
            const parsed = createCategorySchema.safeParse(req.body);

            if (!parsed.success) {
                res.status(400).json({ success: false, errors: parsed.error.errors });
                return;
            }

            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const category = await this.categoryService.createCategory(parsed.data, user.id);
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
        try {
            const parsed = updateCategorySchema.safeParse(req.body);

            if (!parsed.success) {
                res.status(400).json({ success: false, errors: parsed.error.errors });
                return;
            }
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

            const category = await this.categoryService.updateCategory(id, parsed.data, user.id);
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
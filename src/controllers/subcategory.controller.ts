import { Request, Response } from 'express';
import { validate } from 'class-validator';
import { SubcategoryService } from '../service/subcategory.service';
import { CreateSubcategoryDTO, UpdateSubcategoryDTO } from '../dtos/subcategory.dto';
import { ICreateSubcategoryRequest, IUpdateSubcategoryRequest, ISubcategoryIdParams } from '../interface/subcategory.interface';
import { AuthRequest } from '../middlewares/auth.middleware';

export class SubcategoryController {
    private subcategoryService: SubcategoryService;

    constructor() {
        this.subcategoryService = new SubcategoryService();
    }

    async createSubcategory(req: AuthRequest<{ categoryId: number }, {}, ICreateSubcategoryRequest>, res: Response): Promise<void> {
        const dto = new CreateSubcategoryDTO();
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

            const categoryId = req.params.categoryId;
            if (isNaN(categoryId)) {
                res.status(400).json({ success: false, message: 'Invalid category ID' });
                return;
            }

            const subcategory = await this.subcategoryService.createSubcategory(dto, categoryId, user.id);
            res.status(201).json({ success: true, data: subcategory });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getSubcategories(req: Request<{ categoryId: number }>, res: Response): Promise<void> {
        try {
            const categoryId = req.params.categoryId;
            if (isNaN(categoryId)) {
                res.status(400).json({ success: false, message: 'Invalid category ID' });
                return;
            }

            const subcategories = await this.subcategoryService.getSubcategories(categoryId);
            res.status(200).json({ success: true, data: subcategories });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getSubcategoryById(req: Request<ISubcategoryIdParams>, res: Response): Promise<void> {
        try {
            const { id, categoryId } = req.params;
            if (isNaN(id) || isNaN(categoryId)) {
                res.status(400).json({ success: false, message: 'Invalid subcategory or category ID' });
                return;
            }

            const subcategory = await this.subcategoryService.getSubcategoryById(id, categoryId);
            if (!subcategory) {
                res.status(404).json({ success: false, message: 'Subcategory not found' });
                return;
            }

            res.status(200).json({ success: true, data: subcategory });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateSubcategory(req: AuthRequest<ISubcategoryIdParams, {}, IUpdateSubcategoryRequest>, res: Response): Promise<void> {
        const dto = new UpdateSubcategoryDTO();
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

            const { id, categoryId } = req.params;
            if (isNaN(id) || isNaN(categoryId)) {
                res.status(400).json({ success: false, message: 'Invalid subcategory or category ID' });
                return;
            }

            const subcategory = await this.subcategoryService.updateSubcategory(id, dto, categoryId, user.id);
            if (!subcategory) {
                res.status(404).json({ success: false, message: 'Subcategory not found' });
                return;
            }

            res.status(200).json({ success: true, data: subcategory });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async deleteSubcategory(req: AuthRequest<ISubcategoryIdParams>, res: Response): Promise<void> {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const { id, categoryId } = req.params;
            if (isNaN(id) || isNaN(categoryId)) {
                res.status(400).json({ success: false, message: 'Invalid subcategory or category ID' });
                return;
            }

            await this.subcategoryService.deleteSubcategory(id, categoryId, user.id);
            res.status(204).json({ success: true, message: 'Subcategory deleted' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
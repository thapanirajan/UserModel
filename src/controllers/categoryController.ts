

import { Request, Response } from 'express';
import { CategoryService } from '../service/category.service';
import { CreateCategoryDTO } from '../dtos/CategoryDTO';
import { validate } from 'class-validator';
import { CreateSubcategoryDTO } from '../dtos/SubCategoryDTO';


export class CategoryController {
    private categoryService: CategoryService;

    constructor() {
        this.categoryService = new CategoryService();
    }

    async createCategory(req: Request, res: Response): Promise<void> {
        const dto = new CreateCategoryDTO();

        // Copies the properties from req.body to the instance dto
        Object.assign(dto, req.body);

        const errors = await validate(dto);
        if (errors.length > 0) {
            res.status(400).json({ errors });
            return;
        }

        try {
            const category = await this.categoryService.createCategory(dto);
            res.status(201).json(category);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getCategories(req: Request, res: Response): Promise<void> {
        try {
            const categories = await this.categoryService.getCategories();
            res.status(200).json(categories);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async createSubcategory(req: Request, res: Response): Promise<void> {
        const dto = new CreateSubcategoryDTO();
        Object.assign(dto, req.body);

        const errors = await validate(dto);
        if (errors.length > 0) {
            res.status(400).json({ errors });
            return;
        }

        try {
            const subcategory = await this.categoryService.createSubcategory(dto);
            res.status(201).json(subcategory);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

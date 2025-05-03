import { validate } from "class-validator";
import { CreateProductDTO, UpdateProductDTO } from "../dtos/product.dto";
import { ICreateProductRequest, IProductIdParams, IUpdateProductRequest } from "../interface/product.interface";
import { AuthRequest } from "../middlewares/auth.middleware";
import { ProductService } from "../service/product.service";
import { Request, Response } from 'express';

export class ProductController {
    private productServices: ProductService;

    constructor() {
        this.productServices = new ProductService();
    }

    async createProduct(req: AuthRequest<{ categoryId: number; subcategoryId: number }, {}, ICreateProductRequest>, res: Response): Promise<void> {
        const dto = new CreateProductDTO();
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

            const { subcategoryId } = req.params;
            if (isNaN(subcategoryId)) {
                res.status(400).json({ success: false, message: 'Invalid subcategory ID' });
                return;
            }

            const files = req.files as Express.Multer.File[];
            const product = await this.productServices.createProduct(dto, subcategoryId, user.id, files);
            res.status(201).json({ success: true, data: product });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }



    async getProducts(req: Request<{ categoryId: number; subcategoryId: number }>, res: Response): Promise<void> {
        try {
            const { subcategoryId } = req.params;
            if (isNaN(subcategoryId)) {
                res.status(400).json({ success: false, message: 'Invalid subcategory ID' });
                return;
            }

            const products = await this.productServices.getProducts(subcategoryId);
            res.status(200).json({ success: true, data: products });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }


    async getProductById(req: Request<IProductIdParams>, res: Response): Promise<void> {
        try {
            const { id, subcategoryId } = req.params;
            if (isNaN(id) || isNaN(subcategoryId)) {
                res.status(400).json({ success: false, message: 'Invalid product or subcategory ID' });
                return;
            }

            const product = await this.productServices.getProductById(id, subcategoryId);
            if (!product) {
                res.status(404).json({ success: false, message: 'Product not found' });
                return;
            }

            res.status(200).json({ success: true, data: product });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }


    async updateProduct(req: AuthRequest<IProductIdParams, {}, IUpdateProductRequest>, res: Response): Promise<void> {
        const dto = new UpdateProductDTO();
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

            const { id, subcategoryId } = req.params;
            if (isNaN(id) || isNaN(subcategoryId)) {
                res.status(400).json({ success: false, message: 'Invalid product or subcategory ID' });
                return;
            }

            const files = req.files as Express.Multer.File[];
            const product = await this.productServices.updateProduct(id, dto, subcategoryId, user.id, files);
            if (!product) {
                res.status(404).json({ success: false, message: 'Product not found' });
                return;
            }

            res.status(200).json({ success: true, data: product });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }


    async deleteProduct(req: AuthRequest<IProductIdParams>, res: Response): Promise<void> {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const { id, subcategoryId } = req.params;
            if (isNaN(id) || isNaN(subcategoryId)) {
                res.status(400).json({ success: false, message: 'Invalid product or subcategory ID' });
                return;
            }

            await this.productServices.deleteProduct(id, subcategoryId, user.id);
            res.status(204).json({ success: true, message: 'Product deleted' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }


    async deleteProductImage(req: AuthRequest<IProductIdParams & { imageUrl: string }>, res: Response): Promise<void> {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const { id, subcategoryId, imageUrl } = req.params;
            if (isNaN(id) || isNaN(subcategoryId) || !imageUrl) {
                res.status(400).json({ success: false, message: 'Invalid product, subcategory ID, or image URL' });
                return;
            }

            const product = await this.productServices.deleteProductImage(id, subcategoryId, user.id, decodeURIComponent(imageUrl));
            if (!product) {
                res.status(404).json({ success: false, message: 'Product not found' });
                return;
            }

            res.status(200).json({ success: true, data: product });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }


}
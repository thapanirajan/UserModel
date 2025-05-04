// import { CreateProductDTO, UpdateProductDTO } from "../dtos/product.dto";
import { ICreateProductRequest, IProductIdParams, IUpdateProductRequest } from "../interface/product.interface";
import { AuthRequest } from "../middlewares/auth.middleware";
import { ProductService } from "../service/product.service";
import { Request, Response } from 'express';
import { createProductSchema } from "../utils/zod_validations/product.zod";
import { updateCategorySchema } from "../utils/zod_validations/category.zod";

export class ProductController {
    private productServices: ProductService;

    constructor() {
        this.productServices = new ProductService();
    }


    /**
     * @desc Handles the creation of a new product under a given subcategory by an authenticated user.
     *       Validates the request body using Zod schema, verifies user authentication, and supports file upload for product images.
     *       Associates the created product with the requesting user's ID and the specified subcategory ID.
     * @return Returns the newly created product object with all saved details including images, or validation/authentication errors.
     */
    async createProduct(req: AuthRequest<{ categoryId: number; subcategoryId: number }, {}, ICreateProductRequest>, res: Response): Promise<void> {
        try {
            const parsed = createProductSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({ success: false, errors: parsed.error.errors });
                return;
            }

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
            const product = await this.productServices.createProduct(parsed.data, subcategoryId, user.id, files);
            res.status(201).json({ success: true, data: product });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }


    /**
        * @desc Fetches a list of all products that belong to a specific subcategory.
        *       The subcategory ID is received via route parameters and validated.
        *       Useful for displaying products filtered by subcategory for users or clients.
        * @return Returns an array of products associated with the subcategory, or a message if an error occurs or subcategory is invalid.
        */
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



    /**
     * @desc Retrieves a single product's full details by its ID and the associated subcategory ID.
     *       Helps in viewing a specific product for detailed inspection or display on a product page.
     *       Both product and subcategory IDs are validated for correctness.
     * @return Returns the full product object if found, or a 404 message if the product does not exist or ID is invalid.
     */
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



    /**
     * @desc Updates an existing product's details including its description, price, name, or images.
     *       Requires authentication and ensures only the owner of the product can perform updates.
     *       Accepts optional file uploads to replace or append product images.
     * @return Returns the updated product object, or appropriate errors if validation, authorization, or lookup fails.
     */
    async updateProduct(req: AuthRequest<IProductIdParams, {}, IUpdateProductRequest>, res: Response): Promise<void> {
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

            const { id, subcategoryId } = req.params;
            if (isNaN(id) || isNaN(subcategoryId)) {
                res.status(400).json({ success: false, message: 'Invalid product or subcategory ID' });
                return;
            }

            const files = req.files as Express.Multer.File[];
            const product = await this.productServices.updateProduct(id, parsed.data, subcategoryId, user.id, files);
            if (!product) {
                res.status(404).json({ success: false, message: 'Product not found' });
                return;
            }

            res.status(200).json({ success: true, data: product });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }




    /**
     * @desc Deletes a specific product identified by its ID and subcategory, only by an authenticated and authorized user.
     *       Ensures the product belongs to the requesting user before deletion.
     *       Helps in maintaining control and ownership of created products.
     * @return Returns a success message with status 204 if deletion is successful, or error messages if authorization or ID validation fails.
     */
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



    /**
     * @desc Deletes an individual image associated with a specific product.
     *       The request includes the product ID, subcategory ID, and the exact image URL to be removed.
     *       Useful for managing product gallery and removing outdated or incorrect images.
     * @return Returns the updated product object without the deleted image, or appropriate error messages if the product or image is not found.
     */
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
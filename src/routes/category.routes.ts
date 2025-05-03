import { Router, Request, Response } from 'express';
import { validate } from 'class-validator';
import { CategoryController } from '../controllers/category.controller';
import { SubcategoryController } from '../controllers/subcategory.controller';
import { ProductController } from '../controllers/product.controller';
import { authMiddleware, isAdmin, isVendor, restrictToVendorOrAdmin } from '../middlewares/auth.middleware';
import { CreateProductDTO, UpdateProductDTO } from '../dtos/product.dto';
import { CreateCategoryDTO, UpdateCategoryDTO } from "../dtos/category.dto"
import { CreateSubcategoryDTO, UpdateSubcategoryDTO } from "../dtos/subcategory.dto"
import { multerOptions } from '../config/multer.config';
import multer from 'multer';

const router = Router();
const categoryController = new CategoryController();
const subcategoryController = new SubcategoryController();
const productController = new ProductController();
const upload = multer(multerOptions);

const validateDTO = (dtoClass: any) => async (req: Request, res: Response, next: Function) => {
    const dto = new dtoClass();
    Object.assign(dto, req.body);
    const errors = await validate(dto);
    if (errors.length > 0) {
        res.status(400).json({ success: false, errors });
        return;
    }
    next();
};

/**
 * @route POST /api/categories
 * @desc Create a new category
 * @access Private (Admin)
 */
router.post('/', authMiddleware, isAdmin, validateDTO(CreateCategoryDTO), categoryController.createCategory.bind(categoryController));

/**
 * @route GET /api/categories
 * @desc Get all categories
 * @access Public
 */
router.get('/', categoryController.getCategories.bind(categoryController));

/**
 * @route GET /api/categories/:id
 * @desc Get a category by ID
 * @access Public
 */
router.get('/:id', categoryController.getCategoryById.bind(categoryController));

/**
 * @route PUT /api/categories/:id
 * @desc Update a category
 * @access Private (Admin)
 */
router.put('/:id', authMiddleware, isAdmin, validateDTO(UpdateCategoryDTO), categoryController.updateCategory.bind(categoryController));

/**
 * @route DELETE /api/categories/:id
 * @desc Delete a category
 * @access Private (Admin)
 */
router.delete('/:id', authMiddleware, isAdmin, categoryController.deleteCategory.bind(categoryController));

/**
 * @route POST /api/categories/:categoryId/subcategories
 * @desc Create a new subcategory under a category
 * @access Private (Admin)
 */
router.post('/:categoryId/subcategories', authMiddleware, isAdmin, validateDTO(CreateSubcategoryDTO), subcategoryController.createSubcategory.bind(subcategoryController));

/**
 * @route GET /api/categories/:categoryId/subcategories
 * @desc Get all subcategories under a category
 * @access Public
 */
router.get('/:categoryId/subcategories', subcategoryController.getSubcategories.bind(subcategoryController));

/**
 * @route GET /api/categories/:categoryId/subcategories/:id
 * @desc Get a subcategory by ID under a category
 * @access Public
 */
router.get('/:categoryId/subcategories/:id', subcategoryController.getSubcategoryById.bind(subcategoryController));

/**
 * @route PUT /api/categories/:categoryId/subcategories/:id
 * @desc Update a subcategory under a category
 * @access Private (Admin)
 */
router.put('/:categoryId/subcategories/:id', authMiddleware, isAdmin, validateDTO(UpdateSubcategoryDTO), subcategoryController.updateSubcategory.bind(subcategoryController));

/**
 * @route DELETE /api/categories/:categoryId/subcategories/:id
 * @desc Delete a subcategory under a category
 * @access Private (Admin)
 */
router.delete('/:categoryId/subcategories/:id', authMiddleware, isAdmin, subcategoryController.deleteSubcategory.bind(subcategoryController));

/**
 * @route POST /api/categories/:categoryId/subcategories/:subcategoryId/products
 * @desc Create a new product under a subcategory
 * @access Private (Vendor)
 */
router.post('/:categoryId/subcategories/:subcategoryId/products', authMiddleware, isVendor, upload.array('images', 5), validateDTO(CreateProductDTO), productController.createProduct.bind(productController));

/**
 * @route GET /api/categories/:categoryId/subcategories/:subcategoryId/products
 * @desc Get all products under a subcategory
 * @access Public
 */
router.get('/:categoryId/subcategories/:subcategoryId/products', productController.getProducts.bind(productController));

/**
 * @route GET /api/categories/:categoryId/subcategories/:subcategoryId/products/:id
 * @desc Get a product by ID under a subcategory
 * @access Public
 */
router.get('/:categoryId/subcategories/:subcategoryId/products/:id', productController.getProductById.bind(productController));

/**
 * @route PUT /api/categories/:categoryId/subcategories/:subcategoryId/products/:id
 * @desc Update a product under a subcategory
 * @access Private (Vendor)
 */
router.put('/:categoryId/subcategories/:subcategoryId/products/:id', authMiddleware, isVendor, upload.array('images', 5), validateDTO(UpdateProductDTO), productController.updateProduct.bind(productController));

/**
 * @route DELETE /api/categories/:categoryId/subcategories/:subcategoryId/products/:id
 * @desc Delete a product under a subcategory
 * @access Private (Vendor or Admin)
 */
router.delete('/:categoryId/subcategories/:subcategoryId/products/:id', authMiddleware, restrictToVendorOrAdmin, productController.deleteProduct.bind(productController));

/**
 * @route DELETE /api/categories/:categoryId/subcategories/:subcategoryId/products/:id/images/:imageUrl
 * @desc Delete a specific image from a product
 * @access Private (Vendor or Admin)
 */
router.delete('/:categoryId/subcategories/:subcategoryId/products/:id/images/:imageUrl', authMiddleware, restrictToVendorOrAdmin, productController.deleteProductImage.bind(productController));

export default router;
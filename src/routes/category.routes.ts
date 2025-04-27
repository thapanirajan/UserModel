import { Router } from 'express';
import { CategoryController } from '../controllers/categoryController';
import { isAdmin } from '../middlewares/auth.middleware';

const router = Router();
const categoryController = new CategoryController();

router.post('/', isAdmin, categoryController.createCategory.bind(categoryController));
router.get('/', isAdmin, categoryController.getCategories.bind(categoryController));
router.post('/subcategory', isAdmin, categoryController.createSubcategory.bind(categoryController));

export default router;
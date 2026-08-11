import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  createProductSchema,
  updateProductSchema,
  listProductsSchema,
  stockMovementSchema,
  idParamSchema,
} from './products.schema';
import * as controller from './products.controller';

const router = Router();

router.use(authenticate);

// Anyone logged in can browse/view products (sales needs this for challans).
router.get('/', validate(listProductsSchema), controller.listProducts);
router.get('/:id', validate(idParamSchema), controller.getProduct);

// Only Admin/Warehouse manage the product catalog and stock levels.
router.post('/', authorize('ADMIN', 'WAREHOUSE'), validate(createProductSchema), controller.createProduct);
router.put('/:id', authorize('ADMIN', 'WAREHOUSE'), validate(updateProductSchema), controller.updateProduct);
router.post(
  '/:id/stock-movement',
  authorize('ADMIN', 'WAREHOUSE'),
  validate(stockMovementSchema),
  controller.recordStockMovement
);

export default router;

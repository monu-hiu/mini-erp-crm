import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  createChallanSchema,
  updateChallanSchema,
  listChallansSchema,
  idParamSchema,
} from './challans.schema';
import * as controller from './challans.controller';

const router = Router();

router.use(authenticate);

router.get('/', validate(listChallansSchema), controller.listChallans);
router.get('/:id', validate(idParamSchema), controller.getChallan);

// Sales creates and edits challans; Admin can too (oversight).
router.post('/', authorize('ADMIN', 'SALES'), validate(createChallanSchema), controller.createChallan);
router.put('/:id', authorize('ADMIN', 'SALES'), validate(updateChallanSchema), controller.updateChallan);

// Confirming affects stock -- Warehouse (who owns stock) and Admin can confirm,
// alongside Sales who raised it. Adjust to your org's approval flow as needed.
router.post('/:id/confirm', authorize('ADMIN', 'SALES', 'WAREHOUSE'), validate(idParamSchema), controller.confirmChallan);
router.post('/:id/cancel', authorize('ADMIN', 'SALES'), validate(idParamSchema), controller.cancelChallan);

export default router;

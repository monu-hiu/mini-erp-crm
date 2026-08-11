import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  createCustomerSchema,
  updateCustomerSchema,
  listCustomersSchema,
  addFollowUpNoteSchema,
  idParamSchema,
} from './customers.schema';
import * as controller from './customers.controller';

const router = Router();

// All customer routes require login. Read access is broad (sales, warehouse,
// accounts, admin all may need to look up a customer); write access is
// restricted to Sales and Admin, since CRM ownership sits with sales.
router.use(authenticate);

router.get('/', validate(listCustomersSchema), controller.listCustomers);
router.get('/:id', validate(idParamSchema), controller.getCustomer);

router.post('/', authorize('ADMIN', 'SALES'), validate(createCustomerSchema), controller.createCustomer);
router.put('/:id', authorize('ADMIN', 'SALES'), validate(updateCustomerSchema), controller.updateCustomer);

router.post(
  '/:id/notes',
  authorize('ADMIN', 'SALES'),
  validate(addFollowUpNoteSchema),
  controller.addFollowUpNote
);

export default router;

import { ContractController } from 'controllers/ContractController';
import express from 'express';
const router = express.Router();
const contractController = new ContractController()

router.post('/register', contractController.registerKey);
router.post('/installation/:id', contractController.installation);

module.exports = router;
export default router;
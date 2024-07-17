import { ContractController } from 'controllers/ContractController';
import express from 'express';
const router = express.Router();
const contractController = new ContractController()

router.post('/registerkey', contractController.registerKey);
router.post('/installation/:id', contractController.installation);
router.post('/uninstallation/:id', contractController.uninstallation);
router.get('/reportoverview/:id', contractController.getReportOverview);

module.exports = router;
export default router;
import { ContractController } from 'controllers/ContractController';
import express from 'express';
const router = express.Router();
const contractController = new ContractController()

router.post('/registerkey', contractController.registerKey);
router.post('/installation/:id', contractController.installation);
router.post('/uninstallation/:id', contractController.uninstallation);
router.get('/reportoverview/:id', contractController.getReportOverview);
router.post('/report/:id', contractController.reportPendingSoftwareBehavior);
router.post('/startevents/:id', contractController.startEventListeningForSoftware);
router.post('/stopevents/:id', contractController.stopEventListeningForSoftware);

module.exports = router;
export default router;
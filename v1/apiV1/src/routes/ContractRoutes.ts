import { ContractController } from 'controllers/ContractController';
import express from 'express';
const router = express.Router();
const contractController = new ContractController()

router.post('/registerkey', contractController.registerKey);
router.post('/installation/:id', contractController.installation);
router.post('/uninstallation/:id', contractController.uninstallation);
router.get('/reportoverview/:id', contractController.getReportOverview);
router.post('/generatereport/:id', contractController.reportSoftwareBehavior);
router.post('/startevents/:id', contractController.startAllEventListeningForSoftware);
router.post('/stopevents/:id', contractController.stopAllEventListeningForSoftware);

module.exports = router;
export default router;
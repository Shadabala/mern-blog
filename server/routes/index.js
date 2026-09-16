import express from 'express';
import webRoutes from './web.js';
import adminRoutes from './admin.js';

const router = express.Router();

router.use('/', webRoutes);
router.use('/admin', adminRoutes);
router.use('/', adminRoutes);

export default router;
export { webRoutes, adminRoutes };

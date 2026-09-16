import express from 'express';
import webRoutes from './web.js';
import adminRoutes from './admin.js';

const router = express.Router();

// Mount Web & Admin Routes
router.use('/', webRoutes);
router.use('/', adminRoutes);

export default router;

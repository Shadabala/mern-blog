import express from 'express';
import { loginUser, singupUser, logoutUser, refreshToken, getMe } from '../controllers/UserController.js';
import { categoryCreate, categoryUpdate, categoryRemove, categoryGetById, categoryGetAll, categoryToggleStatus } from '../controllers/CategoryController.js';
import { postCreate, postUpdate, postRemove, postGetById, postGetAll, postToggleStatus } from '../controllers/PostController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

//Auth Routes
router.post('/', (request, response) => response.send('This is working'));
router.post('/signup', singupUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/auth/refresh', refreshToken);
router.get('/auth/me', protect, getMe);

// Category Routes

// Public routes
router.get("/category/:id", categoryGetById);
router.get("/category", categoryGetAll);

// Protected routes
router.use("/category", protect);

router.post("/category", categoryCreate);
router.put("/category/:id", categoryUpdate);
router.delete("/category/:id", categoryRemove);
router.patch("/category/:id/toggle", categoryToggleStatus);


//Post Routes

// Public routes
router.get("/post/:id", postGetById);
router.get("/post", postGetAll);

// Protected routes
router.use("/post", protect);

router.post("/post", postCreate);
router.put("/post/:id", postUpdate);
router.delete("/post/:id", postRemove);
router.patch("/post/:id/toggle", postToggleStatus);



export default router;
import express from 'express';
import { loginUser, singupUser, logoutUser, refreshToken, getMe, forgetPassword, verifyOtp, forgetPasswordReset, resetPassword } from '../controllers/UserController.js';
import { categoryCreate, categoryUpdate, categoryRemove, categoryGetById, categoryGetAll, categoryToggleStatus } from '../controllers/CategoryController.js';
import { postCreate, postUpdate, postRemove, postGetById, postGetAll, postToggleStatus } from '../controllers/PostController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { signupSchema, loginSchema, forgetPasswordSchema, verifyOtpSchema, forgetPasswordResetSchema, changePasswordSchema } from '../validators/authValidator.js';
import { createCategorySchema, updateCategorySchema } from '../validators/categoryValidator.js';
import { createPostSchema, updatePostSchema } from '../validators/postValidator.js';

const router = express.Router();

// Auth Routes
router.post('/', (request, response) => response.send('This is working'));
router.post('/signup', validate(signupSchema), singupUser);
router.post('/login', validate(loginSchema), loginUser);
router.post('/logout', protect, logoutUser);

// Unauthenticated Forget Password Flow (OTP based)
router.post('/forget-password', validate(forgetPasswordSchema), forgetPassword);
router.post('/forget-password/verify-otp', validate(verifyOtpSchema), verifyOtp);
router.post('/forget-password/reset', validate(forgetPasswordResetSchema), forgetPasswordReset);

// Authenticated Password Change Route
router.post('/reset-password', protect, validate(changePasswordSchema), resetPassword);

router.post('/auth/refresh', refreshToken);
router.get('/auth/me', protect, getMe);

// Category Routes

// Public routes
router.get("/category/:id", categoryGetById);
router.get("/category", categoryGetAll);

// Protected routes
router.use("/category", protect);

router.post("/category", validate(createCategorySchema), categoryCreate);
router.put("/category/:id", validate(updateCategorySchema), categoryUpdate);
router.delete("/category/:id", categoryRemove);
router.patch("/category/:id/toggle", categoryToggleStatus);

// Post Routes

// Public routes
router.get("/post/:id", postGetById);
router.get("/post", postGetAll);

// Protected routes
router.use("/post", protect);

router.post("/post", validate(createPostSchema), postCreate);
router.put("/post/:id", validate(updatePostSchema), postUpdate);
router.delete("/post/:id", postRemove);
router.patch("/post/:id/toggle", postToggleStatus);

export default router;
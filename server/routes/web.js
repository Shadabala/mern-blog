import express from 'express';
import {
    loginUser,
    singupUser,
    logoutUser,
    refreshToken,
    getMe,
    forgetPassword,
    verifyOtp,
    forgetPasswordReset,
    resetPassword,
    verifyTwoFactor,
    resendTwoFactorOtp
} from '../controllers/UserController.js';
import { categoryGetById, categoryGetAll, getUserPurchasedCategories } from '../controllers/CategoryController.js';
import {
    blogCreate,
    blogUpdate,
    blogRemove,
    blogGetById,
    blogGetAll,
    blogToggleStatus,
    postCreate,
    postUpdate,
    postRemove,
    postGetById,
    postGetAll,
    postToggleStatus
} from '../controllers/BlogController.js';
import { getPublicSettings } from '../controllers/SettingController.js';
import { newComment, getComments, deleteComment } from '../controllers/CommentController.js';
import { getHomepageSettings, getHeaderSettings, getWebsiteSettings } from '../controllers/WebsiteSettingController.js';
import { getPublicPageBySlug } from '../controllers/PageController.js';
import { createPublicContact } from '../controllers/ContactController.js';
import { getActiveLanguages, getTranslationsByCode, syncMissingKeys } from '../controllers/LanguageController.js';
import {
    getUploadedFiles,
    uploadFile,
    getFileByIds,
    destroyFile
} from '../controllers/AizUploadController.js';
import {
    createCheckoutSession,
    createCategoryCheckoutSession,
    createUnifiedCheckoutSession,
    verifyRazorpayPayment,
    submitManualPayment,
    getActivePaymentMethods,
    verifyPaymentSuccess,
    verifyPaymentCancel,
    getAllPayments,
    approveManualPayment,
    rejectManualPayment
} from '../controllers/PaymentController.js';
import { aizUploadMiddleware } from '../middleware/uploadMiddleware.js';
import { protect, authorize, optionalAuth } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import {
    signupSchema,
    loginSchema,
    forgetPasswordSchema,
    verifyOtpSchema,
    forgetPasswordResetSchema,
    changePasswordSchema,
    verify2faSchema,
    resend2faOtpSchema
} from '../validators/authValidator.js';
import { createBlogSchema, updateBlogSchema, createPostSchema, updatePostSchema } from '../validators/blogValidator.js';

const router = express.Router();

// Public System Health & Settings
router.get('/', (req, res) => res.send('MERN Blog Server API Working'));
router.get('/public/settings', getPublicSettings);
router.get('/public/website-settings', getWebsiteSettings);
router.get('/public/website-settings/header', getHeaderSettings);
router.get('/public/website-settings/homepage', getHomepageSettings);
router.get('/public/page/:slug', getPublicPageBySlug);
router.get('/public/languages', getActiveLanguages);
router.get('/public/languages/translations/:code', getTranslationsByCode);
router.post('/public/languages/sync-keys', syncMissingKeys);

// Public Contact Form Submissions
router.post('/public/contact', createPublicContact);
router.post('/contact/submit', createPublicContact);



// Auth Routes (Signup, Login, Logout, Forgot Password, Refresh Token)
router.post('/auth/signup', validate(signupSchema), singupUser);
router.post('/auth/login', validate(loginSchema), loginUser);
router.post('/auth/2fa/verify', validate(verify2faSchema), verifyTwoFactor);
router.post('/auth/2fa/resend', validate(resend2faOtpSchema), resendTwoFactorOtp);
router.post('/auth/logout', protect, logoutUser);

// Unauthenticated Forget Password Flow (OTP based)
router.post('/auth/forget-password', validate(forgetPasswordSchema), forgetPassword);
router.post('/auth/forget-password/verify-otp', validate(verifyOtpSchema), verifyOtp);
router.post('/auth/forget-password/reset', validate(forgetPasswordResetSchema), forgetPasswordReset);

// Authenticated Password Change & User Context Routes
router.post('/auth/reset-password', protect, validate(changePasswordSchema), resetPassword);
router.post('/auth/refresh', refreshToken);
router.get('/auth/me', protect, getMe);

// Public & User Category Routes
router.get("/category/:id", categoryGetById);
router.get("/category", categoryGetAll);
router.get("/categories", categoryGetAll);
router.get("/public/categories", categoryGetAll);
router.get("/user/purchased-categories", protect, getUserPurchasedCategories);
router.get("/categories/purchased", protect, getUserPurchasedCategories);

// Public Dynamic Custom Pages (created in admin panel)
router.get("/page/:slug", getPublicPageBySlug);
router.get("/public/page/:slug", getPublicPageBySlug);
router.get("/pages/:slug", getPublicPageBySlug);
router.get("/api/page/:slug", getPublicPageBySlug);

// Public & User Blog Routes (matching Laravel base-module)
router.get("/blog/:id", optionalAuth, blogGetById);
router.get("/blog", optionalAuth, blogGetAll);
router.get("/blogs", optionalAuth, blogGetAll);
router.get("/public/blogs", optionalAuth, blogGetAll);
router.get("/all-blogs", optionalAuth, blogGetAll);
router.post("/blog", protect, validate(createBlogSchema), blogCreate);
router.put("/blog/:id", protect, validate(updateBlogSchema), blogUpdate);
router.delete("/blog/:id", protect, blogRemove);
router.patch("/blog/:id/toggle", protect, authorize('admin', 'staff'), blogToggleStatus);

// Backward compatibility post routes
router.get("/post/:id", optionalAuth, blogGetById);
router.get("/post", optionalAuth, blogGetAll);
router.get("/posts", optionalAuth, blogGetAll);
router.post("/post", protect, validate(createBlogSchema), blogCreate);
router.put("/post/:id", protect, validate(updateBlogSchema), blogUpdate);
router.delete("/post/:id", protect, blogRemove);
router.patch("/post/:id/toggle", protect, authorize('admin', 'staff'), blogToggleStatus);

// Comments (identical to Blog-Website project)
router.post('/comment/new', optionalAuth, newComment);
router.get('/comments/:id', getComments);
router.get('/comment/:id', getComments);
router.delete('/comment/delete/:id', optionalAuth, deleteComment);
router.delete('/comment/:id', optionalAuth, deleteComment);

// User File Upload & Uploader Routes
router.get("/file/get_uploaded_files", protect, getUploadedFiles);
router.post("/file/upload", protect, aizUploadMiddleware, uploadFile);
router.delete("/file/delete/:id", protect, destroyFile);
router.delete("/file/delete", protect, destroyFile);
router.post("/aiz-uploader/upload", protect, aizUploadMiddleware, uploadFile);
router.get("/aiz-uploader/get-uploaded-files", protect, getUploadedFiles);
router.post("/aiz-uploader/get_file_by_ids", protect, getFileByIds);

// Payment Gateway Routes
router.get("/api/payment/active-methods", getActivePaymentMethods);
router.get("/payment/active-methods", getActivePaymentMethods);
router.post("/api/payment/create-checkout", protect, createUnifiedCheckoutSession);
router.post("/payment/create-checkout", protect, createUnifiedCheckoutSession);
router.post("/api/payment/verify-razorpay", protect, verifyRazorpayPayment);
router.post("/payment/verify-razorpay", protect, verifyRazorpayPayment);
router.post("/api/payment/submit-manual", protect, submitManualPayment);
router.post("/payment/submit-manual", protect, submitManualPayment);

// Legacy Stripe Routes (Backward Compatibility)
router.post("/api/stripe/create-checkout-session", protect, createCheckoutSession);
router.post("/stripe/create-checkout-session", protect, createCheckoutSession);
router.post("/api/stripe/create-category-checkout-session", protect, createCategoryCheckoutSession);
router.post("/stripe/create-category-checkout-session", protect, createCategoryCheckoutSession);
router.get("/verify-success", protect, verifyPaymentSuccess);
router.get("/api/verify-success", protect, verifyPaymentSuccess);
router.get("/verify-cancel", protect, verifyPaymentCancel);
router.get("/api/verify-cancel", protect, verifyPaymentCancel);
router.get("/payments", protect, getAllPayments);
router.get("/api/payments", protect, getAllPayments);
router.put("/payment/approve/:id", protect, authorize('admin', 'staff'), approveManualPayment);
router.put("/api/payment/approve/:id", protect, authorize('admin', 'staff'), approveManualPayment);
router.put("/payment/reject/:id", protect, authorize('admin', 'staff'), rejectManualPayment);
router.put("/api/payment/reject/:id", protect, authorize('admin', 'staff'), rejectManualPayment);

export default router;

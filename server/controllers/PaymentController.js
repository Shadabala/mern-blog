import Stripe from 'stripe';
import Blog from '../models/Blog.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import WebsiteSetting from '../models/WebsiteSetting.js';

/**
 * Retrieve Stripe instance with dynamic key resolution (DB setting -> env var fallback)
 */
const getStripeClient = async () => {
    let secretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;

    try {
        const dbSetting = await WebsiteSetting.findOne({ type: 'STRIPE_SECRET' });
        if (dbSetting?.value && dbSetting.value.trim() !== '') {
            secretKey = dbSetting.value.trim();
        }
    } catch (err) {
        console.warn('Could not query WebsiteSetting for STRIPE_SECRET:', err.message);
    }

    if (!secretKey) {
        throw new Error('Stripe Secret Key is not configured. Please set it in Admin Payment Methods or in server .env');
    }

    return new Stripe(secretKey);
};

// CREATE CHECKOUT SESSION FOR BLOG POST UPGRADE
export const createCheckoutSession = async (req, res) => {
    try {
        const { postId, blogId } = req.body;
        const targetId = postId || blogId;

        if (!targetId) {
            return res.status(400).json({
                success: false,
                msg: 'postId is required'
            });
        }

        const blog = await Blog.findById(targetId);
        if (!blog) {
            return res.status(404).json({
                success: false,
                msg: 'Blog post not found'
            });
        }

        const price = blog.price || 10;
        const title = typeof blog.title === 'string' ? blog.title : (blog.title?.en || 'Premium Blog Post');
        const username = req.user?.username || req.user?.name || 'user';
        const userId = req.user?._id;

        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3001';
        const stripe = await getStripeClient();

        // 1. Create the Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Premium Upgrade: ${title}`,
                            description: `Upgrade "${title}" to verified Premium status`
                        },
                        unit_amount: Math.round(Number(price) * 100)
                    },
                    quantity: 1
                }
            ],
            success_url: `${clientUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${clientUrl}/payment-cancel?session_id={CHECKOUT_SESSION_ID}`,
            metadata: {
                type: 'blog_premium',
                postId: targetId.toString(),
                userId: userId ? userId.toString() : '',
                username
            }
        });

        // 2. Record pending payment in Database
        const payment = await Payment.create({
            paymentType: 'blog_premium',
            postId: targetId,
            userId,
            stripeSessionId: session.id,
            amount: Number(price),
            currency: 'usd',
            status: 'pending',
            username
        });

        return res.status(200).json({
            success: true,
            url: session.url,
            paymentId: payment._id
        });
    } catch (error) {
        console.error('Create checkout error:', error);
        return res.status(500).json({
            success: false,
            msg: error.message || 'Failed to create checkout session'
        });
    }
};

// CREATE CHECKOUT SESSION FOR CATEGORY PURCHASE
export const createCategoryCheckoutSession = async (req, res) => {
    try {
        const { categoryId } = req.body;

        if (!categoryId) {
            return res.status(400).json({
                success: false,
                msg: 'categoryId is required'
            });
        }

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                msg: 'Category not found'
            });
        }

        const userId = req.user?._id;
        const username = req.user?.username || req.user?.name || 'user';

        // Check if user already owns this category
        const user = await User.findById(userId);
        if (user && user.purchased_categories && user.purchased_categories.some(id => id.toString() === categoryId.toString())) {
            return res.status(400).json({
                success: false,
                msg: 'You have already purchased this category'
            });
        }

        const price = category.price || 10;
        const categoryName = category.name || 'Category License';
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3001';
        const stripe = await getStripeClient();

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Category License: ${categoryName}`,
                            description: `Unlock authoring rights to write and publish blogs in the "${categoryName}" category`
                        },
                        unit_amount: Math.round(Number(price) * 100)
                    },
                    quantity: 1
                }
            ],
            success_url: `${clientUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${clientUrl}/payment-cancel?session_id={CHECKOUT_SESSION_ID}`,
            metadata: {
                type: 'category_purchase',
                categoryId: category._id.toString(),
                userId: userId ? userId.toString() : '',
                username
            }
        });

        // Record pending payment in Database
        const payment = await Payment.create({
            paymentType: 'category_purchase',
            categoryId: category._id,
            userId,
            stripeSessionId: session.id,
            amount: Number(price),
            currency: 'usd',
            status: 'pending',
            username
        });

        return res.status(200).json({
            success: true,
            url: session.url,
            paymentId: payment._id
        });
    } catch (error) {
        console.error('Create category checkout error:', error);
        return res.status(500).json({
            success: false,
            msg: error.message || 'Failed to create category checkout session'
        });
    }
};

// VERIFY PAYMENT SUCCESS
export const verifyPaymentSuccess = async (req, res) => {
    try {
        const sessionId = req.query.session_id || req.body?.session_id;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                msg: 'session_id is required'
            });
        }

        const stripe = await getStripeClient();
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const paymentType = session.metadata?.type || 'blog_premium';

        if (session.payment_status === 'paid') {
            if (paymentType === 'category_purchase') {
                const categoryId = session.metadata?.categoryId;
                const userId = session.metadata?.userId || req.user?._id;

                if (userId && categoryId) {
                    await User.findByIdAndUpdate(userId, {
                        $addToSet: { purchased_categories: categoryId }
                    });
                }

                const payment = await Payment.findOneAndUpdate(
                    { stripeSessionId: session.id },
                    {
                        stripePaymentIntentId: session.payment_intent,
                        amount: session.amount_total ? session.amount_total / 100 : undefined,
                        currency: session.currency || 'usd',
                        status: 'success',
                        customerEmail: session.customer_details?.email,
                        failureReason: null
                    },
                    { returnDocument: 'after' }
                );

                return res.status(200).json({
                    success: true,
                    message: 'Payment successful. Category unlocked for publishing.',
                    type: 'category_purchase',
                    categoryId,
                    payment
                });
            } else {
                // Post upgrade
                const postId = session.metadata?.postId;

                if (postId) {
                    await Blog.findByIdAndUpdate(postId, {
                        premium: true
                    });
                }

                const payment = await Payment.findOneAndUpdate(
                    { stripeSessionId: session.id },
                    {
                        stripePaymentIntentId: session.payment_intent,
                        amount: session.amount_total ? session.amount_total / 100 : undefined,
                        currency: session.currency || 'usd',
                        status: 'success',
                        customerEmail: session.customer_details?.email,
                        failureReason: null
                    },
                    { returnDocument: 'after' }
                );

                return res.status(200).json({
                    success: true,
                    message: 'Payment successful. Post upgraded to premium.',
                    type: 'blog_premium',
                    payment
                });
            }
        }

        // If not paid yet, keep pending
        const payment = await Payment.findOneAndUpdate(
            { stripeSessionId: session.id },
            {
                stripePaymentIntentId: session.payment_intent,
                status: 'pending'
            },
            { returnDocument: 'after' }
        );

        return res.status(200).json({
            success: false,
            message: 'Payment is still pending',
            payment
        });
    } catch (error) {
        console.error('Verify success error:', error);
        return res.status(500).json({
            success: false,
            msg: error.message || 'Error verifying payment'
        });
    }
};

// RECORD CANCELLED PAYMENT
export const verifyPaymentCancel = async (req, res) => {
    try {
        const sessionId = req.query.session_id || req.body?.session_id;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                msg: 'session_id is required'
            });
        }

        const payment = await Payment.findOneAndUpdate(
            { stripeSessionId: sessionId },
            {
                status: 'failed',
                failureReason: 'User cancelled transaction or payment failed'
            },
            { returnDocument: 'after' }
        );

        return res.status(200).json({
            success: false,
            message: 'Payment failed or was cancelled by user',
            payment
        });
    } catch (error) {
        console.error('Verify cancel error:', error);
        return res.status(500).json({
            success: false,
            msg: error.message || 'Error processing cancellation'
        });
    }
};

// GET PAYMENT HISTORY FOR LOGGED-IN USER
export const getAllPayments = async (req, res) => {
    try {
        const username = req.user?.username || req.user?.name;
        const userId = req.user?._id;

        if (!username && !userId) {
            return res.status(401).json({
                success: false,
                msg: 'Unauthorized: User identity not found'
            });
        }

        // If admin with all=true query, show all; otherwise show user's own payments only
        const query = (req.user?.role === 'admin' && req.query.all === 'true')
            ? {}
            : {
                $or: [
                    { username },
                    ...(userId ? [{ userId }] : [])
                ]
            };

        const payments = await Payment.find(query)
            .populate({
                path: 'postId',
                select: 'title banner slug price premium'
            })
            .populate({
                path: 'categoryId',
                select: 'name slug icon price'
            })
            .sort({ createdAt: -1 });

        return res.status(200).json(payments);
    } catch (error) {
        console.error('Get all payments error:', error);
        return res.status(500).json({
            success: false,
            msg: error.message || 'Failed to fetch payment records'
        });
    }
};

import crypto from 'crypto';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import Blog from '../models/Blog.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import WebsiteSetting from '../models/WebsiteSetting.js';
import { readEnvFile } from '../utils/envHelper.js';

/**
 * Public Endpoint: Retrieve all currently enabled payment methods
 */
export const getActivePaymentMethods = async (req, res) => {
    try {
        const env = readEnvFile();

        // 1. Stripe
        const stripeActive = Number(env.STRIPE_PAYMENT ?? process.env.STRIPE_PAYMENT ?? 0) === 1;
        const stripeKey = (env.STRIPE_KEY || process.env.STRIPE_KEY || '').trim();

        // 2. Razorpay
        const razorpayActive = Number(env.RAZORPAY_PAYMENT ?? process.env.RAZORPAY_PAYMENT ?? 0) === 1;
        const razorpayKey = (env.RAZORPAY_KEY || process.env.RAZORPAY_KEY || '').trim();

        // 3. PayPal
        const paypalActive = Number(env.PAYPAL_PAYMENT ?? process.env.PAYPAL_PAYMENT ?? 0) === 1;
        const paypalClientId = (env.PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID || '').trim();

        // 4. Manual / Offline Payment
        const manualActive = Number(env.MANUAL_PAYMENT_1_STATUS ?? process.env.MANUAL_PAYMENT_1_STATUS ?? 0) === 1;
        const manualName = env.MANUAL_PAYMENT_1_NAME || 'Bank Transfer / Wire';
        const manualInstruction = env.MANUAL_PAYMENT_1_INSTRUCTION || 'Please transfer funds to Account #123456 and email the receipt.';

        const methods = [];

        if (stripeActive) {
            methods.push({
                id: 'stripe',
                name: 'Stripe (Credit / Debit Card)',
                description: 'Fast and secure card payment via Stripe',
                icon: 'stripe',
                key: stripeKey
            });
        }

        if (razorpayActive) {
            methods.push({
                id: 'razorpay',
                name: 'Razorpay (UPI / NetBanking / Cards)',
                description: 'Pay with UPI, NetBanking, or Indian/International Cards',
                icon: 'razorpay',
                key: razorpayKey
            });
        }

        if (paypalActive) {
            methods.push({
                id: 'paypal',
                name: 'PayPal',
                description: 'Pay with your PayPal balance or credit card',
                icon: 'paypal',
                clientId: paypalClientId
            });
        }

        if (manualActive) {
            methods.push({
                id: 'manual',
                name: manualName,
                description: 'Direct Bank Wire / Offline Payment',
                icon: 'bank',
                instruction: manualInstruction
            });
        }

        return res.status(200).json({
            success: true,
            totalActive: methods.length,
            methods
        });
    } catch (err) {
        console.error('Error fetching active payment methods:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch active payment methods' });
    }
};

/**
 * Retrieve Stripe instance with dynamic key resolution (DB setting -> env var fallback)
 */
const getStripeClient = async () => {
    const env = readEnvFile();
    let secretKey = env.STRIPE_SECRET_KEY || env.STRIPE_SECRET || process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;

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

/**
 * Retrieve Razorpay instance with dynamic key resolution
 */
const getRazorpayClient = () => {
    const env = readEnvFile();
    const key_id = env.RAZORPAY_KEY || process.env.RAZORPAY_KEY;
    const key_secret = env.RAZORPAY_SECRET || process.env.RAZORPAY_SECRET;

    if (!key_id || !key_secret) {
        throw new Error('Razorpay credentials (RAZORPAY_KEY, RAZORPAY_SECRET) are not configured in Admin Payment Methods.');
    }

    return new Razorpay({ key_id, key_secret });
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
        const userRole = req.user?.role;

        if (!username && !userId) {
            return res.status(401).json({
                success: false,
                msg: 'Unauthorized: User identity not found'
            });
        }

        const isAdminOrStaff = userRole === 'admin' || userRole === 'staff';
        const isAllRequested = req.query.all === 'true' || isAdminOrStaff;

        let query = {};

        if (!isAdminOrStaff || req.query.all !== 'true') {
            query.$or = [
                { username },
                ...(userId ? [{ userId }] : [])
            ];
        }

        // Method filter (e.g. manual, stripe, razorpay, paypal)
        if (req.query.method && req.query.method !== 'all') {
            query.paymentMethod = req.query.method;
        }

        // Status filter (e.g. pending, success, failed)
        if (req.query.status && req.query.status !== 'all') {
            query.status = req.query.status;
        }

        // Category filter
        if (req.query.categoryId) {
            query.categoryId = req.query.categoryId;
        }

        // Post / Blog filter
        if (req.query.postId || req.query.blogId) {
            query.postId = req.query.postId || req.query.blogId;
        }

        // Search query
        if (req.query.search && req.query.search.trim()) {
            const term = req.query.search.trim();
            const searchOr = [
                { username: { $regex: term, $options: 'i' } },
                { transactionId: { $regex: term, $options: 'i' } },
                { manualDetails: { $regex: term, $options: 'i' } },
                { customerEmail: { $regex: term, $options: 'i' } }
            ];
            if (query.$or) {
                query.$and = [{ $or: query.$or }, { $or: searchOr }];
                delete query.$or;
            } else {
                query.$or = searchOr;
            }
        }

        const payments = await Payment.find(query)
            .populate({
                path: 'postId',
                select: 'title banner slug price premium'
            })
            .populate({
                path: 'categoryId',
                select: 'name slug icon price'
            })
            .populate({
                path: 'userId',
                select: 'name email username avatar role'
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

/**
 * UNIFIED CHECKOUT SESSION INITIATION
 * Checks active payment methods and routes accordingly (Stripe, Razorpay, PayPal, Manual)
 */
export const createUnifiedCheckoutSession = async (req, res) => {
    try {
        const { postId, blogId, categoryId, paymentMethod = 'stripe', manualDetails = '', transactionId = '' } = req.body;
        const targetPostId = postId || blogId;
        const env = readEnvFile();

        // 1. Resolve item details & price
        let itemTitle = 'Service Purchase';
        let price = 10;
        let paymentType = 'blog_premium';

        if (categoryId) {
            paymentType = 'category_purchase';
            const category = await Category.findById(categoryId);
            if (!category) return res.status(404).json({ success: false, msg: 'Category not found' });
            price = Number(category.price) || 10;
            itemTitle = `Category License: ${category.name?.en || category.name || 'Category'}`;
        } else if (targetPostId) {
            paymentType = 'blog_premium';
            const blog = await Blog.findById(targetPostId);
            if (!blog) return res.status(404).json({ success: false, msg: 'Blog post not found' });
            price = Number(blog.price) || 10;
            itemTitle = `Premium Upgrade: ${typeof blog.title === 'string' ? blog.title : (blog.title?.en || 'Blog')}`;
        } else {
            return res.status(400).json({ success: false, msg: 'Either postId or categoryId is required' });
        }

        const username = req.user?.username || req.user?.name || 'user';
        const userId = req.user?._id;
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3001';

        // 2. Process based on requested paymentMethod
        if (paymentMethod === 'stripe') {
            const stripeActive = Number(env.STRIPE_PAYMENT ?? process.env.STRIPE_PAYMENT ?? 0) === 1;
            if (!stripeActive) {
                return res.status(400).json({ success: false, msg: 'Stripe payment is currently disabled in Admin settings.' });
            }

            const stripe = await getStripeClient();
            const session = await stripe.checkout.sessions.create({
                mode: 'payment',
                line_items: [{
                    price_data: {
                        currency: 'usd',
                        product_data: { name: itemTitle },
                        unit_amount: Math.round(price * 100)
                    },
                    quantity: 1
                }],
                success_url: `${clientUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${clientUrl}/payment-cancel?session_id={CHECKOUT_SESSION_ID}`,
                metadata: {
                    type: paymentType,
                    postId: targetPostId ? targetPostId.toString() : '',
                    categoryId: categoryId ? categoryId.toString() : '',
                    userId: userId ? userId.toString() : '',
                    username
                }
            });

            const payment = await Payment.create({
                paymentType,
                paymentMethod: 'stripe',
                postId: targetPostId || null,
                categoryId: categoryId || null,
                userId,
                stripeSessionId: session.id,
                amount: price,
                currency: 'usd',
                status: 'pending',
                username
            });

            return res.status(200).json({
                success: true,
                method: 'stripe',
                url: session.url,
                paymentId: payment._id
            });
        }

        if (paymentMethod === 'razorpay') {
            const razorpayActive = Number(env.RAZORPAY_PAYMENT ?? process.env.RAZORPAY_PAYMENT ?? 0) === 1;
            if (!razorpayActive) {
                return res.status(400).json({ success: false, msg: 'Razorpay payment is currently disabled in Admin settings.' });
            }

            const rzp = getRazorpayClient();
            const rzpOrder = await rzp.orders.create({
                amount: Math.round(price * 100), // subunits
                currency: 'INR',
                receipt: `rcpt_${Date.now()}`,
                notes: {
                    type: paymentType,
                    postId: targetPostId ? targetPostId.toString() : '',
                    categoryId: categoryId ? categoryId.toString() : '',
                    userId: userId ? userId.toString() : '',
                    username
                }
            });

            const payment = await Payment.create({
                paymentType,
                paymentMethod: 'razorpay',
                postId: targetPostId || null,
                categoryId: categoryId || null,
                userId,
                razorpayOrderId: rzpOrder.id,
                amount: price,
                currency: 'inr',
                status: 'pending',
                username
            });

            return res.status(200).json({
                success: true,
                method: 'razorpay',
                orderId: rzpOrder.id,
                amount: rzpOrder.amount,
                currency: rzpOrder.currency,
                key: env.RAZORPAY_KEY || process.env.RAZORPAY_KEY,
                itemTitle,
                paymentId: payment._id
            });
        }

        if (paymentMethod === 'manual') {
            const manualActive = Number(env.MANUAL_PAYMENT_1_STATUS ?? process.env.MANUAL_PAYMENT_1_STATUS ?? 0) === 1;
            if (!manualActive) {
                return res.status(400).json({ success: false, msg: 'Manual payment method is currently disabled in Admin settings.' });
            }

            const ref = transactionId || `MANUAL-${Date.now()}`;
            const payment = await Payment.create({
                paymentType,
                paymentMethod: 'manual',
                postId: targetPostId || null,
                categoryId: categoryId || null,
                userId,
                transactionId: ref,
                manualDetails: manualDetails || '',
                amount: price,
                currency: 'usd',
                status: 'pending',
                username
            });

            return res.status(200).json({
                success: true,
                method: 'manual',
                message: 'Manual payment submitted successfully! It is pending approval by the admin.',
                paymentId: payment._id,
                transactionId: ref
            });
        }

        if (paymentMethod === 'paypal') {
            const paypalActive = Number(env.PAYPAL_PAYMENT ?? process.env.PAYPAL_PAYMENT ?? 0) === 1;
            if (!paypalActive) {
                return res.status(400).json({ success: false, msg: 'PayPal payment is currently disabled in Admin settings.' });
            }

            const clientId = env.PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID;
            if (!clientId) {
                return res.status(400).json({ success: false, msg: 'PayPal Client ID is not configured.' });
            }

            const ref = `PP-${Date.now()}`;
            const payment = await Payment.create({
                paymentType,
                paymentMethod: 'paypal',
                postId: targetPostId || null,
                categoryId: categoryId || null,
                userId,
                paypalOrderId: ref,
                transactionId: ref,
                amount: price,
                currency: 'usd',
                status: 'pending',
                username
            });

            return res.status(200).json({
                success: true,
                method: 'paypal',
                clientId,
                amount: price,
                currency: 'USD',
                paymentId: payment._id
            });
        }

        return res.status(400).json({
            success: false,
            msg: `Unknown or unsupported payment method: ${paymentMethod}`
        });
    } catch (err) {
        console.error('Unified checkout error:', err);
        return res.status(500).json({
            success: false,
            msg: err.message || 'Failed to create checkout session'
        });
    }
};

/**
 * VERIFY RAZORPAY PAYMENT
 */
export const verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, msg: 'Missing Razorpay signature verification parameters' });
        }

        const env = readEnvFile();
        const secret = env.RAZORPAY_SECRET || process.env.RAZORPAY_SECRET;

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, msg: 'Invalid signature. Payment verification failed.' });
        }

        const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
        if (!payment) {
            return res.status(404).json({ success: false, msg: 'Payment record not found' });
        }

        payment.status = 'success';
        payment.razorpayPaymentId = razorpay_payment_id;
        payment.razorpaySignature = razorpay_signature;
        payment.transactionId = razorpay_payment_id;
        await payment.save();

        if (payment.paymentType === 'category_purchase' && payment.categoryId) {
            await User.findByIdAndUpdate(payment.userId || req.user?._id, {
                $addToSet: { purchased_categories: payment.categoryId }
            });
        } else if (payment.postId) {
            await Blog.findByIdAndUpdate(payment.postId, { premium: true });
        }

        return res.status(200).json({
            success: true,
            message: 'Payment verified successfully! Your purchase has been activated.',
            payment
        });
    } catch (err) {
        console.error('Razorpay verification error:', err);
        return res.status(500).json({ success: false, msg: err.message || 'Verification error' });
    }
};

/**
 * SUBMIT MANUAL PAYMENT
 */
export const submitManualPayment = async (req, res) => {
    return createUnifiedCheckoutSession(
        { ...req, body: { ...req.body, paymentMethod: 'manual' } },
        res
    );
};

/**
 * ADMIN: APPROVE MANUAL PAYMENT
 */
export const approveManualPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findById(id);

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment record not found' });
        }

        payment.status = 'success';
        payment.failureReason = null;
        await payment.save();

        if (payment.paymentType === 'category_purchase' && payment.categoryId) {
            if (payment.userId) {
                await User.findByIdAndUpdate(payment.userId, {
                    $addToSet: { purchased_categories: payment.categoryId }
                });
            }
            if (payment.username) {
                await User.findOneAndUpdate(
                    { $or: [{ username: payment.username }, { name: payment.username }] },
                    { $addToSet: { purchased_categories: payment.categoryId } }
                );
            }
        } else if (payment.postId) {
            await Blog.findByIdAndUpdate(payment.postId, { premium: true });
        }

        const populatedPayment = await Payment.findById(id)
            .populate('postId', 'title banner slug price premium')
            .populate('categoryId', 'name slug icon price')
            .populate('userId', 'name email username avatar role');

        return res.status(200).json({
            success: true,
            message: 'Payment approved successfully! Access has been granted to the user.',
            payment: populatedPayment
        });
    } catch (err) {
        console.error('Approve manual payment error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to approve payment' });
    }
};

/**
 * ADMIN: REJECT MANUAL PAYMENT
 */
export const rejectManualPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const payment = await Payment.findById(id);

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment record not found' });
        }

        payment.status = 'failed';
        payment.failureReason = reason || 'Payment rejected by admin';
        await payment.save();

        // If it was a category purchase, revoke access
        if (payment.paymentType === 'category_purchase' && payment.categoryId) {
            if (payment.userId) {
                await User.findByIdAndUpdate(payment.userId, {
                    $pull: { purchased_categories: payment.categoryId }
                });
            }
            if (payment.username) {
                await User.findOneAndUpdate(
                    { $or: [{ username: payment.username }, { name: payment.username }] },
                    { $pull: { purchased_categories: payment.categoryId } }
                );
            }
        }

        const populatedPayment = await Payment.findById(id)
            .populate('postId', 'title banner slug price premium')
            .populate('categoryId', 'name slug icon price')
            .populate('userId', 'name email username avatar role');

        return res.status(200).json({
            success: true,
            message: 'Payment has been rejected.',
            payment: populatedPayment
        });
    } catch (err) {
        console.error('Reject manual payment error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to reject payment' });
    }
};

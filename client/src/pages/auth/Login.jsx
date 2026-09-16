import React, { useState, useEffect } from 'react';
import { TextField, Box, Button, Typography, styled, Alert, CircularProgress } from '@mui/material';
import { Security as SecurityIcon, ArrowBack as BackIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { loginUser, verify2faApi, resend2faOtpApi } from '../../api/auth.api';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../utils/toast';

const Component = styled(Box)`
    width: 420px;
    margin: 50px auto;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    background: #fff;
    border: 1px solid #e2e8f0;
    overflow: hidden;
`;

const Image = styled('img')({
    width: 90,
    display: 'flex',
    margin: 'auto',
    padding: '40px 0 0'
});

const Wrapper = styled(Box)`
    padding: 25px 35px;
    display: flex;
    flex: 1;
    overflow: auto;
    flex-direction: column;
    & > div, & > button, & > p {
        margin-top: 18px;
    }
`;

const LoginButton = styled(Button)`
    text-transform: none;
    background: #FB641B;
    color: #fff;
    height: 48px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.95rem;
    &:hover {
        background: #e25510;
    }
`;

const SignupButton = styled(Button)`
    text-transform: none;
    background: #fff;
    color: #2874f0;
    height: 48px;
    border-radius: 6px;
    box-shadow: 0 2px 4px 0 rgb(0 0 0 / 10%);
    border: 1px solid #e2e8f0;
    font-weight: 600;
    &:hover {
        background: #f8f9fa;
    }
`;

const Text = styled(Typography)`
    color: #878787;
    font-size: 12px;
`;

const imageURL = 'https://www.sesta.it/wp-content/uploads/2021/03/logo-blog-sesta-trasparente.png';

const Login = () => {
    const navigate = useNavigate();
    const { loginState } = useAuth();

    const [login, setLogin] = useState({ email: '', password: '' });
    const [loginErrors, setLoginErrors] = useState({ email: '', password: '' });
    const [apiError, setApiError] = useState('');
    const [loading, setLoading] = useState(false);

    // 2FA state
    const [is2faStep, setIs2faStep] = useState(false);
    const [twoFactorData, setTwoFactorData] = useState({ userId: '', email: '' });
    const [otp, setOtp] = useState('');
    const [countdown, setCountdown] = useState(60);
    const [resending, setResending] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Timer countdown effect for 2FA OTP
    useEffect(() => {
        let timer = null;
        if (is2faStep && countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [is2faStep, countdown]);

    const onValueChange = (e) => {
        const { name, value } = e.target;
        setLogin((prev) => ({ ...prev, [name]: value }));
        setLoginErrors((prev) => ({ ...prev, [name]: '' }));
        setApiError('');
    };

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        const errors = { email: '', password: '' };
        if (!login.email.trim()) errors.email = 'Email or Username is required.';
        if (!login.password) errors.password = 'Password is required.';

        if (errors.email || errors.password) {
            setLoginErrors(errors);
            return;
        }

        setLoading(true);
        setApiError('');
        try {
            const response = await loginUser({ email: login.email, password: login.password });

            // Check if 2FA is required for this user
            if (response?.twoFactorRequired) {
                setIs2faStep(true);
                setTwoFactorData({ userId: response.userId, email: response.email });
                setCountdown(response.cooldownSeconds || 60);
                setSuccessMessage('A 6-digit verification code has been sent to your email.');
                toast.info('Verification code sent to your email.');
                setLoading(false);
                return;
            }

            if (response?.user) {
                loginState(response.user, response.accessToken);
                toast.success('Logged in successfully!');
                const role = response.user.role || response.user.user_type || 'user';
                try {
                    sessionStorage.setItem('account', JSON.stringify({
                        name: response.user.name || '',
                        username: response.user.username || '',
                        role
                    }));
                } catch {}

                if (role === 'admin' || role === 'staff') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/dashboard');
                }
            } else {
                const msg = response?.message || 'Invalid credentials';
                setApiError(msg);
                toast.error(msg);
            }
        } catch (err) {
            const msg = err?.response?.data?.message || 'Something went wrong! Please try again.';
            setApiError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify2fa = async (e) => {
        if (e) e.preventDefault();
        if (!otp || otp.trim().length !== 6) {
            setApiError('Please enter a valid 6-digit verification code.');
            toast.warning('Please enter a valid 6-digit verification code.');
            return;
        }

        setLoading(true);
        setApiError('');
        try {
            const response = await verify2faApi({
                userId: twoFactorData.userId,
                email: twoFactorData.email,
                otp: otp.trim()
            });

            if (response?.user) {
                loginState(response.user, response.accessToken);
                toast.success('Identity verified! Welcome back.');
                const role = response.user.role || response.user.user_type || 'user';
                try {
                    sessionStorage.setItem('account', JSON.stringify({
                        name: response.user.name || '',
                        username: response.user.username || '',
                        role
                    }));
                } catch {}

                if (role === 'admin' || role === 'staff') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/dashboard');
                }
            } else {
                const msg = response?.message || 'Invalid code';
                setApiError(msg);
                toast.error(msg);
            }
        } catch (err) {
            const msg = err?.response?.data?.message || 'Verification failed. Please try again.';
            setApiError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (countdown > 0) return;
        setResending(true);
        setApiError('');
        try {
            const res = await resend2faOtpApi({
                userId: twoFactorData.userId,
                email: twoFactorData.email
            });
            const msg = res?.message || 'New code sent to your email.';
            setSuccessMessage(msg);
            toast.info(msg);
            setCountdown(res?.cooldownSeconds || 60);
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to resend code';
            setApiError(msg);
            toast.error(msg);
        } finally {
            setResending(false);
        }
    };

    return (
        <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
            <Component>
                <Box>
                    <Image src={imageURL} alt="blog" />

                    {!is2faStep ? (
                        /* Standard Login Step */
                        <Wrapper component="form" onSubmit={handleLogin}>
                            <Typography variant="h6" fontWeight={700} textAlign="center" color="#1e293b">
                                Sign In to Your Account
                            </Typography>

                            <TextField
                                variant="outlined"
                                size="small"
                                value={login.email}
                                onChange={onValueChange}
                                name="email"
                                label="Username or Email"
                                error={Boolean(loginErrors.email)}
                                helperText={loginErrors.email}
                            />
                            <TextField
                                variant="outlined"
                                size="small"
                                value={login.password}
                                onChange={onValueChange}
                                name="password"
                                label="Password"
                                type="password"
                                error={Boolean(loginErrors.password)}
                                helperText={loginErrors.password}
                            />

                            {apiError && <Alert severity="error">{apiError}</Alert>}

                            <LoginButton type="submit" variant="contained" disabled={loading}>
                                {loading ? <CircularProgress size={22} color="inherit" /> : 'Login'}
                            </LoginButton>

                            <Text style={{ textAlign: 'center' }}>OR</Text>

                            <SignupButton onClick={() => navigate('/signup')} style={{ marginBottom: 20 }}>
                                Create an account
                            </SignupButton>
                        </Wrapper>
                    ) : (
                        /* 2FA Verification Step with Request Countdown Timer */
                        <Wrapper component="form" onSubmit={handleVerify2fa}>
                            <Box textAlign="center">
                                <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1 }}>
                                    <SecurityIcon sx={{ color: '#2563eb', fontSize: 26 }} />
                                </Box>
                                <Typography variant="h6" fontWeight={700} color="#1e293b">
                                    Two-Factor Security
                                </Typography>
                                <Typography variant="caption" color="textSecondary" display="block">
                                    Enter the 6-digit code sent to <strong>{twoFactorData.email}</strong>
                                </Typography>
                            </Box>

                            {successMessage && (
                                <Alert severity="info" onClose={() => setSuccessMessage('')}>
                                    {successMessage}
                                </Alert>
                            )}

                            {apiError && <Alert severity="error">{apiError}</Alert>}

                            <TextField
                                fullWidth
                                variant="outlined"
                                size="small"
                                placeholder="000000"
                                value={otp}
                                onChange={(e) => { setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6)); setApiError(''); }}
                                inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: '8px', fontSize: '1.25rem', fontWeight: 700 } }}
                                autoFocus
                            />

                            {/* Resend with Cooldown Timer */}
                            <Box display="flex" justifyContent="space-between" alignItems="center" px={0.5}>
                                <Typography variant="caption" color="textSecondary">
                                    {countdown > 0 ? (
                                        <span>Resend code in <strong>{countdown}s</strong></span>
                                    ) : (
                                        <span>Didn't get code?</span>
                                    )}
                                </Typography>

                                <Button
                                    size="small"
                                    onClick={handleResendOtp}
                                    disabled={countdown > 0 || resending}
                                    startIcon={resending ? <CircularProgress size={14} /> : <RefreshIcon fontSize="small" />}
                                    sx={{ textTransform: 'none', fontWeight: 600 }}
                                >
                                    Resend Code
                                </Button>
                            </Box>

                            <LoginButton type="submit" variant="contained" disabled={loading || otp.length !== 6}>
                                {loading ? <CircularProgress size={22} color="inherit" /> : 'Verify & Continue'}
                            </LoginButton>

                            <Button
                                startIcon={<BackIcon />}
                                onClick={() => { setIs2faStep(false); setOtp(''); setApiError(''); }}
                                sx={{ textTransform: 'none', color: '#64748b' }}
                            >
                                Back to Login
                            </Button>
                        </Wrapper>
                    )}
                </Box>
            </Component>
        </Box>
    );
};

export default Login;
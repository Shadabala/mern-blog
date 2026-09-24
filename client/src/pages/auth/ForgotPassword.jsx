import { useState } from "react";
import { Box, Typography, TextField, Button, Alert, CircularProgress, Stepper, Step, StepLabel } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import { forgetPassword, verifyOtp, resetPasswordWithOtp } from "../../api/auth.api";
import { toast } from "../../utils/toast";

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0); // 0: Send Email, 1: Verify OTP, 2: Reset Password
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setServerError("");
        setLoading(true);
        try {
            const data = await forgetPassword(email);
            const msg = data.message || "OTP code sent to your email.";
            setSuccessMessage(msg);
            toast.info(msg);
            setStep(1);
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to send OTP.";
            setServerError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setServerError("");
        setLoading(true);
        try {
            const data = await verifyOtp({ email, otp });
            const msg = data.message || "OTP verified successfully.";
            setSuccessMessage(msg);
            toast.success(msg);
            setStep(2);
        } catch (err) {
            const msg = err.response?.data?.message || "Invalid OTP code.";
            setServerError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            const msg = "Password and confirm password do not match.";
            setServerError(msg);
            toast.warning(msg);
            return;
        }
        setServerError("");
        setLoading(true);
        try {
            const data = await resetPasswordWithOtp({ email, otp, password, confirm_password: confirmPassword });
            const msg = data.message || "Password reset successfully. Redirecting to login...";
            setSuccessMessage(msg);
            toast.success(msg);
            setTimeout(() => {
                navigate("/login");
            }, 1500);
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to reset password.";
            setServerError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <Box sx={{ textAlign: "center", mb: 3 }}>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                    Forgot Password
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Reset your account password via OTP email verification
                </Typography>
            </Box>

            <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
                <Step><StepLabel>Email</StepLabel></Step>
                <Step><StepLabel>OTP</StepLabel></Step>
                <Step><StepLabel>Reset</StepLabel></Step>
            </Stepper>

            {serverError && <Alert severity="error" sx={{ mb: 3 }}>{serverError}</Alert>}
            {successMessage && <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>}

            {step === 0 && (
                <Box component="form" onSubmit={handleSendOtp}>
                    <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        margin="normal"
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="outlined"
                        className="btn-outline-primary"
                        size="large"
                        disabled={loading}
                        sx={{ mt: 2 }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Send OTP Code"}
                    </Button>
                </Box>
            )}

            {step === 1 && (
                <Box component="form" onSubmit={handleVerifyOtp}>
                    <TextField
                        fullWidth
                        label="Enter 6-Digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        margin="normal"
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="outlined"
                        className="btn-outline-primary"
                        size="large"
                        disabled={loading}
                        sx={{ mt: 2 }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Verify OTP"}
                    </Button>
                </Box>
            )}

            {step === 2 && (
                <Box component="form" onSubmit={handleResetPassword}>
                    <TextField
                        fullWidth
                        label="New Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Confirm New Password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        margin="normal"
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="outlined"
                        className="btn-outline-primary"
                        size="large"
                        disabled={loading}
                        sx={{ mt: 2 }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Reset Password"}
                    </Button>
                </Box>
            )}

            <Box sx={{ textAlign: "center", mt: 3 }}>
                <Typography variant="body2">
                    Remembered password?{" "}
                    <RouterLink to="/login" style={{ fontWeight: 600, color: "#0284c7" }}>
                        Back to Login
                    </RouterLink>
                </Typography>
            </Box>
        </AuthLayout>
    );
};

export default ForgotPassword;

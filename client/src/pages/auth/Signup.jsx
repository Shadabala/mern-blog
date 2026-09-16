import { useState } from 'react';
import { TextField, Box, Button, Typography, styled } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { signupUser } from '../../api/auth.api';
import { toast } from '../../utils/toast';

const Component = styled(Box)`
    width: 400px;
    margin: 50px auto;
    box-shadow: 5px 2px 5px 2px rgb(0 0 0 / 0.2);
    border-radius: 8px;
    background: #fff;
`;

const Image = styled('img')({
    width: 100,
    display: 'flex',
    margin: 'auto',
    padding: '50px 0 0'
});

const Wrapper = styled(Box)`
    padding: 25px 35px;
    display: flex;
    flex: 1;
    overflow: auto;
    flex-direction: column;
    & > div, & > button, & > p {
        margin-top: 20px;
    }
`;

const LoginButton = styled(Button)`
    text-transform: none;
    background: #FB641B;
    color: #fff;
    height: 48px;
    border-radius: 2px;
    &:hover {
        background: #e25510;
    }
`;

const SignupButton = styled(Button)`
    text-transform: none;
    background: #fff;
    color: #2874f0;
    height: 48px;
    border-radius: 2px;
    box-shadow: 0 2px 4px 0 rgb(0 0 0 / 20%);
    &:hover {
        background: #f8f9fa;
    }
`;

const Text = styled(Typography)`
    color: #878787;
    font-size: 12px;
`;

const Error = styled(Typography)`
    font-size: 11px;
    color: #ff6161;
    margin-top: 10px;
    font-weight: 600;
`;

const Success = styled(Typography)`
    font-size: 12px;
    color: #2e7d32;
    margin-top: 10px;
    font-weight: 600;
`;

const imageURL = 'https://www.sesta.it/wp-content/uploads/2021/03/logo-blog-sesta-trasparente.png';

const Signup = () => {
    const navigate = useNavigate();

    const [signup, setSignup] = useState({ name: '', username: '', email: '', password: '' });
    const [signupErrors, setSignupErrors] = useState({ name: '', username: '', email: '', password: '' });
    const [apiError, setApiError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const onInputChange = (e) => {
        const { name, value } = e.target;
        setSignup((prev) => ({ ...prev, [name]: value }));
        setSignupErrors((prev) => ({ ...prev, [name]: '' }));
        setApiError('');
    };

    const handleSignup = async () => {
        const errors = { name: '', username: '', email: '', password: '' };
        if (!signup.name.trim()) errors.name = 'Name is required.';
        if (!signup.username.trim()) errors.username = 'Username is required.';
        if (!signup.email.trim()) errors.email = 'Email is required.';
        if (!signup.password) errors.password = 'Password is required.';

        if (errors.name || errors.username || errors.email || errors.password) {
            setSignupErrors(errors);
            return;
        }

        try {
            const response = await signupUser(signup);
            if (response?.user || response?.success) {
                setSuccessMessage('Registration successful! Redirecting to login...');
                toast.success('Registration successful! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            } else {
                const msg = response?.message || 'Signup failed';
                setApiError(msg);
                toast.error(msg);
            }
        } catch (err) {
            const msg = err?.response?.data?.message || 'Something went wrong! Please try again.';
            setApiError(msg);
            toast.error(msg);
        }
    };

    return (
        <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Component>
                <Box>
                    <Image src={imageURL} alt="blog" />
                    <Wrapper>
                        <TextField
                            variant="standard"
                            value={signup.name}
                            onChange={onInputChange}
                            name="name"
                            label="Enter Name"
                            error={Boolean(signupErrors.name)}
                            helperText={signupErrors.name}
                        />
                        <TextField
                            variant="standard"
                            value={signup.username}
                            onChange={onInputChange}
                            name="username"
                            label="Enter Username"
                            error={Boolean(signupErrors.username)}
                            helperText={signupErrors.username}
                        />
                        <TextField
                            variant="standard"
                            value={signup.email}
                            onChange={onInputChange}
                            name="email"
                            label="Enter Email"
                            error={Boolean(signupErrors.email)}
                            helperText={signupErrors.email}
                        />
                        <TextField
                            variant="standard"
                            value={signup.password}
                            onChange={onInputChange}
                            name="password"
                            label="Enter Password"
                            type="password"
                            error={Boolean(signupErrors.password)}
                            helperText={signupErrors.password}
                        />

                        {successMessage && <Success>{successMessage}</Success>}
                        {apiError && <Error>{apiError}</Error>}

                        <LoginButton variant="contained" onClick={handleSignup}>
                            Sign Up
                        </LoginButton>
                        <Text style={{ textAlign: 'center' }}>OR</Text>
                        <SignupButton onClick={() => navigate('/login')} style={{ marginBottom: 30 }}>
                            Already have an account?
                        </SignupButton>
                    </Wrapper>
                </Box>
            </Component>
        </Box>
    );
};

export default Signup;
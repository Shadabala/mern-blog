import { useState, useEffect, useContext } from 'react';

import { TextField, Box, Button, Typography, styled } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/i18n';

import { API } from '../../service/api';
import { DataContext } from '../../context/DataProvider';
import { toast } from '../../utils/toast';

const Component = styled(Box)`
    width: 400px;
    margin: auto;
    box-shadow: 5px 2px 5px 2px rgb(0 0 0/ 0.6);
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
`;

const SignupButton = styled(Button)`
    text-transform: none;
    background: #fff;
    color: #2874f0;
    height: 48px;
    border-radius: 2px;
    box-shadow: 0 2px 4px 0 rgb(0 0 0 / 20%);
`;

const Text = styled(Typography)`
    color: #878787;
    font-size: 12px;
`;

const Error = styled(Typography)`
    font-size: 10px;
    color: #ff6161;
    line-height: 0;
    margin-top: 10px;
    font-weight: 600;
`;

const Success = styled(Typography)`
    font-size: 12px;
    color: #2e7d32;
    margin-top: 10px;
    font-weight: 600;
`;

const loginInitialValues = {
    username: '',
    password: ''
};

const signupInitialValues = {
    name: '',
    username: '',
    email: '',
    password: '',
};

const loginInitialErrors = {
    username: '',
    password: ''
};

const signupInitialErrors = {
    name: '',
    username: '',
    email: '',
    password: ''
};

// ─── Validators ────────────────────────────────────────────────────────────────

const validateLogin = ({ username, password }) => {
    const errors = { username: '', password: '' };
    if (!username.trim()) {
        errors.username = 'Username is required.';
    }
    if (!password) {
        errors.password = 'Password is required.';
    } else if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters.';
    }
    return errors;
};

const validateSignup = ({ name, username, email, password }) => {
    const errors = { name: '', username: '', email: '', password: '' };
    if (!name.trim()) {
        errors.name = 'Name is required.';
    } else if (name.trim().length < 2) {
        errors.name = 'Name must be at least 2 characters.';
    }
    if (!email.trim()) {
        errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.email = 'Email is invalid.';
    }
    if (!username.trim()) {
        errors.username = 'Username is required.';
    } else if (username.trim().length < 3) {
        errors.username = 'Username must be at least 3 characters.';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
        errors.username = 'Username can only contain letters, numbers and underscores.';
    }
    if (!password) {
        errors.password = 'Password is required.';
    } else if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters.';
    }
    return errors;
};

const hasErrors = (errors) => Object.values(errors).some(Boolean);

// ───────────────────────────────────────────────────────────────────────────────

const Login = ({ isUserAuthenticated }) => {
    const [login, setLogin] = useState(loginInitialValues);
    const [signup, setSignup] = useState(signupInitialValues);
    const [loginErrors, setLoginErrors] = useState(loginInitialErrors);
    const [signupErrors, setSignupErrors] = useState(signupInitialErrors);
    const [apiError, showApiError] = useState('');
    const [success, setSuccess] = useState('');
    const [account, toggleAccount] = useState('login');
    const { t } = useTranslation();

    const navigate = useNavigate();
    const { setAccount } = useContext(DataContext);

    const imageURL = 'https://www.sesta.it/wp-content/uploads/2021/03/logo-blog-sesta-trasparente.png';

    // Clear API-level error whenever the user starts typing
    useEffect(() => {
        showApiError('');
    }, [login, signup]);

    // ── Login ──────────────────────────────────────────────────────────────────

    const onValueChange = (e) => {
        const { name, value } = e.target;
        setLogin((prev) => ({ ...prev, [name]: value }));
        setLoginErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const loginUser = async () => {
        const errors = validateLogin(login);
        setLoginErrors(errors);
        if (hasErrors(errors)) return;

        try {
            const response = await API.userLogin(login);
            if (response.isSuccess) {
                setSuccess(response.data.msg);
                showApiError('');
                toast.success(response.data.msg || 'Logged in successfully!');
                sessionStorage.setItem('accessToken', `Bearer ${response.data.accessToken}`);
                sessionStorage.setItem('refreshToken', `Bearer ${response.data.refreshToken}`);
                setAccount({ name: response.data.name, username: response.data.username });
                isUserAuthenticated(true);
                setLogin(loginInitialValues);
                navigate('/');
            } else {
                const msg = response.msg || 'Something went wrong! Please try again later.';
                showApiError(msg);
                toast.error(msg);
            }
        } catch (err) {
            const msg = 'Something went wrong! Please try again later.';
            showApiError(msg);
            toast.error(msg);
        }
    };

    // ── Signup ─────────────────────────────────────────────────────────────────

    const onInputChange = (e) => {
        const { name, value } = e.target;
        setSignup((prev) => ({ ...prev, [name]: value }));
        setSignupErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const signupUser = async () => {
        const errors = validateSignup(signup);
        setSignupErrors(errors);
        if (hasErrors(errors)) return;

        try {
            const response = await API.userSignup(signup);
            if (response.isSuccess) {
                setSuccess(response.data.msg);
                toast.success(response.data.msg || 'Signed up successfully!');
                showApiError('');
                setSignup(signupInitialValues);
                setSignupErrors(signupInitialErrors);
                toggleAccount('login');
            } else {
                const msg = response.msg || 'Something went wrong! Please try again later.';
                showApiError(msg);
                toast.error(msg);
            }
        } catch (err) {
            const msg = 'Something went wrong! Please try again later.';
            showApiError(msg);
            toast.error(msg);
        }
    };

    // ── Toggle ─────────────────────────────────────────────────────────────────

    const toggleSignup = () => {
        showApiError('');
        setLoginErrors(loginInitialErrors);
        setSignupErrors(signupInitialErrors);
        account === 'signup' ? toggleAccount('login') : toggleAccount('signup');
    };

    return (
        <Component>
            <Box>
                <Image src={imageURL} alt="blog" />
                {
                    account === 'login' ?
                        <Wrapper>
                            <TextField
                                variant="standard"
                                value={login.username}
                                onChange={onValueChange}
                                name='username'
                                label={t("login.enterUsername", "Enter Username or Email")}
                                error={Boolean(loginErrors.username)}
                                helperText={loginErrors.username}
                            />
                            <TextField
                                variant="standard"
                                value={login.password}
                                onChange={onValueChange}
                                name='password'
                                label={t("login.enterPassword", "Enter Password")}
                                type='password'
                                error={Boolean(loginErrors.password)}
                                helperText={loginErrors.password}
                            />

                            {apiError && <Error>{apiError}</Error>}

                            <LoginButton variant="contained" onClick={loginUser}>{t("login.title", "Login")}</LoginButton>
                            <Text style={{ textAlign: 'center' }}>{t("login.or", "OR")}</Text>
                            <SignupButton onClick={toggleSignup} style={{ marginBottom: 50 }}>{t("login.createAccount", "Create an account")}</SignupButton>
                        </Wrapper> :
                        <Wrapper>
                            <TextField
                                variant="standard"
                                value={signup.name}
                                onChange={onInputChange}
                                name='name'
                                label={t("register.name", "Enter Name")}
                                error={Boolean(signupErrors.name)}
                                helperText={signupErrors.name}
                            />
                            <TextField
                                variant="standard"
                                value={signup.username}
                                onChange={onInputChange}
                                name='username'
                                label={t("register.username", "Enter Username")}
                                error={Boolean(signupErrors.username)}
                                helperText={signupErrors.username}
                            />
                            <TextField
                                variant="standard"
                                value={signup.email}
                                onChange={onInputChange}
                                name='email'
                                label={t("register.email", "Enter Email")}
                                error={Boolean(signupErrors.email)}
                                helperText={signupErrors.email}
                            />
                            <TextField
                                variant="standard"
                                value={signup.password}
                                onChange={onInputChange}
                                name='password'
                                label={t("login.enterPassword", "Enter Password")}
                                type='password'
                                error={Boolean(signupErrors.password)}
                                helperText={signupErrors.password}
                            />
                            {success && <Success>{success}</Success>}

                            {apiError && <Error>{apiError}</Error>}

                            <LoginButton variant="contained" onClick={signupUser}>{t("register.title", "Sign Up")}</LoginButton>
                            <Text style={{ textAlign: 'center' }}>{t("login.or", "OR")}</Text>
                            <SignupButton variant="contained" onClick={toggleSignup}>{t("register.alreadyHaveAccount", "Already have an account?")}</SignupButton>
                        </Wrapper>
                }
            </Box>
        </Component>
    );
};

export default Login;

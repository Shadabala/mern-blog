import { useState, useContext } from 'react';
import { AppBar, Toolbar, styled, Button, Typography, Avatar, Box, Menu, MenuItem, IconButton } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { CreateOutlined, DashboardOutlined, HomeOutlined, InfoOutlined, ContactMailOutlined } from '@mui/icons-material';
import { DataContext } from '../../context/DataProvider';
import { API } from '../../service/api';
import { useTranslation } from "../../i18n/i18n";
import { useSettings } from "../../context/SettingsContext";
import LanguageSwitcher from "./LanguageSwitcher";

const StyledAppBar = styled(AppBar)`
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
`;

const Brand = styled(Typography)`
    font-size: 24px;
    font-weight: 800;
    background: linear-gradient(90deg, #e94560, #f5a623);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 2px;
    margin-right: 40px;
    cursor: pointer;
    flex-shrink: 0;
`;

const NavLink = styled(Link)`
    color: rgba(255,255,255,0.8);
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
    padding: 6px 12px;
    border-radius: 8px;
    transition: all 0.2s;
    &:hover {
        color: #fff;
        background: rgba(255,255,255,0.1);
    }
`;

const WriteButton = styled(Button)`
    background: linear-gradient(135deg, #e94560, #c0392b);
    color: #fff;
    border-radius: 20px;
    padding: 6px 20px;
    text-transform: none;
    font-weight: 600;
    font-size: 14px;
    &:hover {
        background: linear-gradient(135deg, #c0392b, #e94560);
        box-shadow: 0 4px 15px rgba(233,69,96,0.4);
    }
`;

const Header = ({ isAuthenticated }) => {
    const navigate = useNavigate();
    const { account, setAccount } = useContext(DataContext);
    const { get_setting, uploaded_asset } = useSettings();
    const [anchorEl, setAnchorEl] = useState(null);
    const { t } = useTranslation();

    const headerLogo = get_setting('header_logo');
    const siteName = get_setting('site_name', get_setting('website_name', t("navbar.home")));

    const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const logout = async () => {
        handleMenuClose();
        const token = sessionStorage.getItem('refreshToken');
        try { await API.userLogout({ token }); } catch (_) { }
        sessionStorage.clear();
        setAccount({ name: '', username: '' });
        navigate('/account');
    };

    return (
        <StyledAppBar position={get_setting('enable_sticky_header', 'on') === 'off' ? 'static' : 'fixed'}>
            <Toolbar sx={{ gap: 1, px: { xs: 2, md: 4 } }}>
                <Box
                    onClick={() => navigate('/')}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        mr: { xs: 2, md: 4 },
                        flexShrink: 0
                    }}
                >
                    {headerLogo ? (
                        <Box
                            component="img"
                            src={uploaded_asset(headerLogo)}
                            alt={siteName}
                            sx={{
                                width: { xs: 40, md: 50 },
                                height: { xs: 40, md: 50 },
                                borderRadius: 20,
                                objectFit: 'cover',
                                display: 'block'
                            }}
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = document.getElementById('user-brand-text');
                                if (fallback) fallback.style.display = 'block';
                            }}
                        />
                    ) : null}
                    <Brand
                        id="user-brand-text"
                        sx={{
                            display: headerLogo ? 'none' : 'block',
                            mr: 0
                        }}
                    >
                        {siteName}
                    </Brand>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
                    <NavLink to='/'><HomeOutlined sx={{ fontSize: 18 }} />{t("navbar.home")}</NavLink>
                    {isAuthenticated && (
                        <>
                            <NavLink to='/dashboard'><DashboardOutlined sx={{ fontSize: 18 }} />{t("navbar.dashboard")}</NavLink>
                        </>
                    )}
                    <NavLink to='/about'><InfoOutlined sx={{ fontSize: 18 }} />{t("navbar.about")}</NavLink>
                    <NavLink to='/contact'><ContactMailOutlined sx={{ fontSize: 18 }} />{t("navbar.contact")}</NavLink>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {isAuthenticated ? (
                        <>
                            <WriteButton
                                startIcon={<CreateOutlined />}
                                onClick={() => navigate('/create')}
                            >
                                {t("navbar.write")}
                            </WriteButton>
                            <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
                                <Avatar
                                    sx={{
                                        width: 36, height: 36,
                                        background: 'linear-gradient(135deg, #e94560, #f5a623)',
                                        fontSize: 14, fontWeight: 700
                                    }}
                                >
                                    {account.name?.charAt(0)?.toUpperCase() || 'U'}
                                </Avatar>
                            </IconButton>
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleMenuClose}
                                PaperProps={{
                                    sx: {
                                        background: '#1a1a2e',
                                        color: '#fff',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 2,
                                        minWidth: 180
                                    }
                                }}
                            >
                                <MenuItem sx={{ opacity: 0.7, fontSize: 13 }}>
                                    {t("navbar.signedInAs")} <strong style={{ marginLeft: 4 }}>{account.username}</strong>
                                </MenuItem>
                                <MenuItem onClick={() => { handleMenuClose(); navigate('/dashboard'); }}>
                                    {t("navbar.dashboard")}
                                </MenuItem>
                                <MenuItem onClick={() => { handleMenuClose(); navigate('/payments'); }}>
                                    {t("navbar.payments", "Payment History")}
                                </MenuItem>
                                <MenuItem onClick={() => { handleMenuClose(); navigate('/uploads'); }}>
                                    {t("navbar.uploads", "Media Manager")}
                                </MenuItem>
                                <MenuItem onClick={logout} sx={{ color: '#e94560' }}>
                                    {t("navbar.logout")}
                                </MenuItem>

                            </Menu>
                        </>
                    ) : (
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/account')}
                            sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', borderRadius: 20, textTransform: 'none' }}
                        >
                            {t("navbar.signIn")}
                        </Button>
                    )}
                    <LanguageSwitcher />
                </Box>
            </Toolbar>
        </StyledAppBar>
    );
};

export default Header;
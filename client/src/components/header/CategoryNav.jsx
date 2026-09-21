import { useState, useEffect, useRef } from 'react';
import { Box, Chip, Container, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { API } from '../../service/api';

const CategoryNav = ({ sticky = false }) => {
    const [categories, setCategories] = useState([]);
    const scrollRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const activeCategory = searchParams.get('category') || 'All';
    const { currentLang, translate } = useLanguage();
    const { get_setting } = useSettings();

    const enableStickyHeader = get_setting('enable_sticky_header', 'on') !== 'off';
    const stickyTop = enableStickyHeader ? 64 : 0;

    // Fetch categories on language change
    useEffect(() => {
        API.getCategories({ lang: currentLang, status: true }).then(res => {
            if (res.isSuccess) {
                const list = res.data?.categories || res.data?.data || (Array.isArray(res.data) ? res.data : []);
                setCategories(Array.isArray(list) ? list : []);
            }
        });
    }, [currentLang]);

    const checkArrows = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 10);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        checkArrows();
        window.addEventListener('resize', checkArrows);
        return () => window.removeEventListener('resize', checkArrows);
    }, [categories]);

    const handleScroll = (direction) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -220 : 220,
                behavior: 'smooth'
            });
        }
    };

    const handleClick = (catValue) => {
        if (catValue === 'All') {
            navigate('/');
        } else {
            navigate(`/?category=${encodeURIComponent(catValue)}`);
        }
    };

    // Hide on login, register, create, update, and admin pages
    const hiddenPaths = ['/account', '/login', '/signup', '/forgot-password', '/create'];
    const isHidden = hiddenPaths.some(p => location.pathname === p)
        || location.pathname.startsWith('/update/')
        || location.pathname.startsWith('/admin');
    if (isHidden) return null;

    const allCategories = [{ _id: 'All' }, ...categories];

    return (
        <Box
            sx={{
                width: '100%',
                bgcolor: '#ffffff',
                borderBottom: '1px solid #e5e7eb',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
                position: sticky ? 'sticky' : 'relative',
                top: sticky ? stickyTop : 'auto',
                zIndex: 990,
                transition: 'top 0.2s ease, box-shadow 0.2s ease',
            }}
        >
            <Container maxWidth="lg" sx={{ position: 'relative', px: { xs: 1.5, sm: 3 } }}>
                {showLeftArrow && (
                    <IconButton
                        size="small"
                        onClick={() => handleScroll('left')}
                        sx={{
                            position: 'absolute',
                            left: 4,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            zIndex: 2,
                            bgcolor: '#ffffff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            '&:hover': { bgcolor: '#f8fafc' },
                            width: 28,
                            height: 28
                        }}
                    >
                        <ChevronLeft fontSize="small" />
                    </IconButton>
                )}

                <Box
                    ref={scrollRef}
                    onScroll={checkArrows}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.2,
                        py: 1.25,
                        overflowX: 'auto',
                        whiteSpace: 'nowrap',
                        scrollbarWidth: 'none',
                        '&::-webkit-scrollbar': { display: 'none' },
                        msOverflowStyle: 'none'
                    }}
                >
                    {allCategories.map(cat => {
                        const isAll = cat._id === 'All';
                        const catValue = isAll ? 'All' : (cat.slug || cat.name);
                        const catLabel = isAll ? translate('blog.category', 'All Categories') : (cat.name || cat.translated_name);

                        const isCatActive = isAll
                            ? (activeCategory === 'All' || !activeCategory)
                            : (
                                activeCategory.toLowerCase() === (catValue || '').toLowerCase() ||
                                (cat.slug && activeCategory.toLowerCase() === cat.slug.toLowerCase()) ||
                                (cat.name && activeCategory.toLowerCase() === cat.name.toLowerCase()) ||
                                activeCategory === cat._id
                            );

                        const isActive = isCatActive && location.pathname === '/';

                        return (
                            <Chip
                                key={cat._id}
                                label={catLabel}
                                onClick={() => handleClick(catValue)}
                                sx={{
                                    cursor: 'pointer',
                                    fontWeight: isActive ? 700 : 500,
                                    fontSize: '0.85rem',
                                    height: 34,
                                    px: 0.75,
                                    borderRadius: '18px',
                                    background: isActive
                                        ? 'linear-gradient(135deg, #e94560 0%, #c0392b 100%)'
                                        : '#f1f5f9',
                                    color: isActive ? '#ffffff' : '#334155',
                                    border: isActive ? 'none' : '1px solid #e2e8f0',
                                    boxShadow: isActive ? '0 3px 10px rgba(233, 69, 96, 0.35)' : 'none',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    flexShrink: 0,
                                    '&:hover': {
                                        background: isActive
                                            ? 'linear-gradient(135deg, #c0392b 0%, #e94560 100%)'
                                            : '#e2e8f0',
                                        color: isActive ? '#ffffff' : '#0f172a',
                                        transform: 'translateY(-1px)',
                                        boxShadow: isActive
                                            ? '0 4px 12px rgba(233, 69, 96, 0.45)'
                                            : '0 2px 6px rgba(0, 0, 0, 0.06)'
                                    },
                                    '&:active': {
                                        transform: 'scale(0.97)'
                                    }
                                }}
                            />
                        );
                    })}
                </Box>

                {showRightArrow && (
                    <IconButton
                        size="small"
                        onClick={() => handleScroll('right')}
                        sx={{
                            position: 'absolute',
                            right: 4,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            zIndex: 2,
                            bgcolor: '#ffffff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            '&:hover': { bgcolor: '#f8fafc' },
                            width: 28,
                            height: 28
                        }}
                    >
                        <ChevronRight fontSize="small" />
                    </IconButton>
                )}
            </Container>
        </Box>
    );
};

export default CategoryNav;

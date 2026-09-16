import { useState, useEffect } from 'react';
import { Box, Chip, styled } from '@mui/material';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { API } from '../../service/api';

const Bar = styled(Box)`
    background: #fff;
    padding: 10px 40px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    position: sticky;
    top: 64px;
    z-index: 100;
    border-bottom: 1px solid rgba(0,0,0,0.04);

    @media (max-width: 600px) {
        padding: 10px 16px;
        gap: 8px;
    }
`;

const CategoryNav = () => {
    const [categories, setCategories] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const activeCategory = searchParams.get('category') || 'All';
    const { currentLang, translate } = useLanguage();

    // Re-fetch on currentLang change
    useEffect(() => {
        API.getCategories({ lang: currentLang, status: true }).then(res => {
            if (res.isSuccess) {
                const list = res.data?.categories || res.data?.data || (Array.isArray(res.data) ? res.data : []);
                setCategories(Array.isArray(list) ? list : []);
            }
        });
    }, [currentLang]);

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

    return (
        <Bar>
            {[{ _id: 'All' }, ...categories].map(cat => {
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
                            fontWeight: 600,
                            fontSize: 12,
                            height: 30,
                            background: isActive
                                ? 'linear-gradient(135deg, #e94560, #c0392b)'
                                : 'rgba(0,0,0,0.06)',
                            color: isActive
                                ? '#fff'
                                : '#444',
                            border: 'none',
                            transition: 'all 0.2s',
                            '&:hover': {
                                background: isActive
                                    ? 'linear-gradient(135deg, #c0392b, #e94560)'
                                    : 'rgba(26,26,46,0.12)',
                                color: isActive ? '#fff' : '#1a1a2e',
                            }
                        }}
                    />
                );
            })}
        </Bar>
    );
};

export default CategoryNav;

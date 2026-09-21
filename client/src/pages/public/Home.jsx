import { useState, useEffect } from 'react';
import { Box, Typography, Skeleton, styled, TextField, InputAdornment } from '@mui/material';
import { SearchOutlined } from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from '../../i18n/i18n';
import { useLanguage } from '../../context/LanguageContext';
import { API } from '../../service/api';
import PublicLayout from '../../layouts/PublicLayout';
import Post from '../../components/home/post/Post';
import CategoryNav from '../../components/header/CategoryNav';

const PageWrapper = styled(Box)`
    min-height: 100vh;
    background: #f8f9fa;
`;

const HeroSection = styled(Box)`
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    padding: 80px 40px 60px;
    text-align: center;
    color: #fff;

    @media (max-width: 600px) {
        padding: 50px 20px 40px;
    }
`;

const HeroTitle = styled(Typography)`
    font-size: clamp(32px, 5vw, 64px);
    font-weight: 900;
    background: linear-gradient(90deg, #fff 0%, #e94560 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 16px;
`;

const HeroSub = styled(Typography)`
    color: rgba(255,255,255,0.7);
    font-size: 18px;
    max-width: 500px;
    margin: 0 auto 32px;

    @media (max-width: 600px) {
        font-size: 15px;
        margin-bottom: 24px;
    }
`;

const SearchBox = styled(TextField)`
    background: rgba(255,255,255,0.1);
    border-radius: 50px;
    max-width: 480px;
    width: 100%;
    & .MuiOutlinedInput-root {
        border-radius: 50px;
        color: #fff;
        & fieldset { border-color: rgba(255,255,255,0.3); }
        &:hover fieldset { border-color: rgba(255,255,255,0.6); }
        &.Mui-focused fieldset { border-color: #e94560; }
    }
    & input::placeholder { color: rgba(255,255,255,0.5); }
`;

const PostsGrid = styled(Box)`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 28px;
    padding: 40px 24px;
    max-width: 1400px;
    margin: 0 auto;

    @media (max-width: 600px) {
        grid-template-columns: 1fr;
        gap: 20px;
        padding: 24px 16px;
    }
`;

const EmptyState = styled(Box)`
    text-align: center;
    padding: 80px 40px;
    color: #878787;

    @media (max-width: 600px) {
        padding: 60px 20px;
    }
`;

const Home = () => {
    const { t } = useTranslation();
    const { currentLang } = useLanguage();
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [searchParams] = useSearchParams();
    const category = searchParams.get('category') || 'All';

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await API.getCategories({ lang: currentLang, status: true });
                if (res.isSuccess) {
                    const list = res.data?.categories || res.data?.data || (Array.isArray(res.data) ? res.data : []);
                    setCategories(Array.isArray(list) ? list : []);
                }
            } catch (err) {
                console.error("Failed to fetch categories:", err);
            }
        };
        fetchCategories();
    }, [currentLang]);

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                const res = await API.getAllPosts({
                    category: category === 'All' ? '' : category,
                    lang: currentLang,
                    status: true
                });
                if (res.isSuccess) {
                    const list = res.data?.blogs || res.data?.posts || res.data?.data || (Array.isArray(res.data) ? res.data : []);
                    setPosts(Array.isArray(list) ? list : []);
                }
            } catch (err) {
                console.error("Failed to fetch posts:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, [category, currentLang]);

    const filtered = (Array.isArray(posts) ? posts : []).filter(p => {
        const pTitle = typeof p.title === 'string'
            ? p.title
            : (typeof p.title === 'object' ? Object.values(p.title || {}).join(' ') : '');
        const pDesc = typeof p.description === 'string'
            ? p.description
            : (typeof p.short_description === 'string'
                ? p.short_description
                : (typeof p.description === 'object' ? Object.values(p.description || {}).join(' ') : ''));
        const pAuthor = p.author?.name || p.username || '';

        const s = search.toLowerCase();
        return pTitle.toLowerCase().includes(s) ||
               pDesc.toLowerCase().includes(s) ||
               pAuthor.toLowerCase().includes(s);
    });

    return (
        <PublicLayout>
            <PageWrapper>
                {/* Hero Section - Blog Website Style */}
                <HeroSection>
                    <HeroTitle>{t("home.welcome", "Welcome to My Blog")}</HeroTitle>
                    <HeroSub>{t("home.subtitle", "A place where I share my thoughts and experiences")}</HeroSub>
                    <SearchBox
                        placeholder={t("home.search", "Search...")}
                        variant="outlined"
                        size="small"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchOutlined sx={{ color: 'rgba(255,255,255,0.5)' }} />
                                    </InputAdornment>
                                )
                            }
                        }}
                    />
                </HeroSection>

                {/* Category Navigation Bar */}
                <CategoryNav />

                {/* Posts Grid - Blog Website Style */}
                {loading ? (
                    <PostsGrid>
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} variant="rounded" height={340} sx={{ borderRadius: 3 }} />
                        ))}
                    </PostsGrid>
                ) : filtered.length > 0 ? (
                    <PostsGrid>
                        {filtered.map(post => (
                            <Post key={post._id || post.id} post={post} categories={categories} />
                        ))}
                    </PostsGrid>
                ) : (
                    <EmptyState>
                        <Typography fontSize={48}>📬</Typography>
                        <Typography fontSize={20} fontWeight={600} mt={2}>
                            {t("home.noPosts", "No posts found")}
                        </Typography>
                        <Typography color="#aaa" mt={1}>
                            {search
                                ? t("home.tryDifferentSearch", "Try a different search term")
                                : t("home.noPublishedPosts", "No published posts in this category yet")}
                        </Typography>
                    </EmptyState>
                )}
            </PageWrapper>
        </PublicLayout>
    );
};

export default Home;

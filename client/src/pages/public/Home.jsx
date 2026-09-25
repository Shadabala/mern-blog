import { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Skeleton, styled, TextField, InputAdornment,
    Button, IconButton, Stack
} from '@mui/material';
import {
    SearchOutlined,
    ArrowBackIosNew as PrevIcon,
    ArrowForwardIos as NextIcon,
    OpenInNew as OpenIcon
} from '@mui/icons-material';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from '../../i18n/i18n';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { API } from '../../service/api';
import PublicLayout from '../../layouts/PublicLayout';
import Post from '../../components/home/post/Post';
import CategoryNav from '../../components/header/CategoryNav';

const PageWrapper = styled(Box)`
    min-height: 100vh;
    background: #f8f9fa;
`;

const HeroContainer = styled(Box)`
    position: relative;
    overflow: hidden;
    min-height: 240px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    color: #fff;
    padding: 38px 24px 32px;

    @media (max-width: 900px) {
        min-height: 210px;
        padding: 30px 20px 28px;
    }

    @media (max-width: 600px) {
        min-height: 180px;
        padding: 22px 14px 22px;
    }
`;

const SlideBackground = styled(Box)`
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center center;
    background-repeat: no-repeat;
    transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1;

    &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
            135deg,
            rgba(26, 26, 46, 0.82) 0%,
            rgba(22, 33, 62, 0.80) 50%,
            rgba(15, 52, 96, 0.82) 100%
        );
        backdrop-filter: blur(1px);
    }
`;

const HeroContent = styled(Box)`
    position: relative;
    z-index: 2;
    text-align: center;
    max-width: 760px;
    width: 100%;
    margin: 0 auto;
`;

const HeroTitle = styled(Typography)`
    font-size: clamp(22px, 3.2vw, 38px);
    font-weight: 800;
    color: #ffffff;
    line-height: 1.25;
    margin-bottom: 8px;
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);

    & span.gradient-word {
        background: linear-gradient(90deg, #ffffff 0%, #ff8a9e 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    @media (max-width: 600px) {
        font-size: clamp(18px, 5vw, 24px);
        margin-bottom: 6px;
    }
`;

const HeroSub = styled(Typography)`
    color: rgba(255, 255, 255, 0.88);
    font-size: clamp(13px, 1.4vw, 15px);
    max-width: 580px;
    margin: 0 auto 14px;
    line-height: 1.5;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.35);

    @media (max-width: 600px) {
        font-size: 13px;
        margin-bottom: 12px;
        line-height: 1.4;
    }
`;

const SearchBox = styled(TextField)`
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(8px);
    border-radius: 50px;
    max-width: 440px;
    width: 100%;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);

    & .MuiOutlinedInput-root {
        border-radius: 50px;
        color: #fff;
        height: 40px;
        font-size: 0.9rem;
        & fieldset { border-color: rgba(255, 255, 255, 0.35); }
        &:hover fieldset { border-color: rgba(255, 255, 255, 0.7); }
        &.Mui-focused fieldset { border-color: var(--primary-color, #e94560); }
    }
    & input::placeholder { color: rgba(255, 255, 255, 0.65); font-size: 0.85rem; }

    @media (max-width: 600px) {
        max-width: 100%;
        & .MuiOutlinedInput-root {
            height: 38px;
            font-size: 0.85rem;
        }
    }
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
    const { get_setting, uploaded_asset } = useSettings();

    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [searchParams] = useSearchParams();
    const category = searchParams.get('category') || 'All';

    // Retrieve settings for Homepage Hero Slider
    const sliderImages = get_setting('home_slider_images', []);
    const sliderLinks = get_setting('home_slider_links', []);
    const sliderHeadings = get_setting('home_slider_heading', []);
    const sliderTexts = get_setting('home_slider_text', []);

    // Construct normalized slides array
    const slides = useMemo(() => {
        const imagesArr = Array.isArray(sliderImages) ? sliderImages : (sliderImages ? [sliderImages] : []);
        const linksArr = Array.isArray(sliderLinks) ? sliderLinks : [];
        const headingsArr = Array.isArray(sliderHeadings) ? sliderHeadings : [];
        const textsArr = Array.isArray(sliderTexts) ? sliderTexts : [];

        const totalItems = Math.max(imagesArr.length, linksArr.length, headingsArr.length, textsArr.length);
        const result = [];

        for (let i = 0; i < totalItems; i++) {
            const rawImg = imagesArr[i] || '';
            const imgUrl = rawImg ? (uploaded_asset(rawImg) || rawImg) : '';
            const heading = headingsArr[i] || '';
            const text = textsArr[i] || '';
            const link = linksArr[i] || '';

            if (imgUrl || heading || text || link) {
                result.push({
                    image: imgUrl,
                    heading: heading || "",
                    text: text || "",
                    link: link || ''
                });
            }
        }

        // Default fallback slide if none configured in settings
        if (result.length === 0) {
            result.push({
                image: '',
                heading: "",
                text: "",
                link: ''
            });
        }

        return result;
    }, [sliderImages, sliderLinks, sliderHeadings, sliderTexts, uploaded_asset, t]);

    const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    // Auto-advance slider every 6 seconds when more than 1 slide exists
    useEffect(() => {
        if (slides.length <= 1 || isHovered) return;
        const timer = setInterval(() => {
            setCurrentSlideIdx(prev => (prev + 1) % slides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [slides.length, isHovered]);

    // Ensure index is within range if slides change
    useEffect(() => {
        if (currentSlideIdx >= slides.length) {
            setCurrentSlideIdx(0);
        }
    }, [slides.length, currentSlideIdx]);

    const activeSlide = slides[currentSlideIdx] || slides[0];

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
                {/* Hero Section / Slider */}
                <HeroContainer
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {/* Background Slide with smooth transition */}
                    {activeSlide?.image && (
                        <SlideBackground
                            key={`slide-bg-${currentSlideIdx}`}
                            sx={{ backgroundImage: `url("${activeSlide.image}")` }}
                        />
                    )}

                    {/* Hero Content (Heading, Subtitle, CTA Link, Search) */}
                    <HeroContent>
                        {/* Heading */}
                        <HeroTitle>
                            {activeSlide?.heading || ''}
                        </HeroTitle>

                        {/* Subtitle / Text */}
                        <HeroSub>
                            {activeSlide?.text || ''}
                        </HeroSub>

                        {/* Target Link Action Button if specified */}
                        {activeSlide?.link && (
                            <Box sx={{ mb: 1.8 }}>
                                <Button
                                    component={activeSlide.link.startsWith('http') ? 'a' : RouterLink}
                                    {...(activeSlide.link.startsWith('http')
                                        ? { href: activeSlide.link, target: '_blank', rel: 'noopener noreferrer' }
                                        : { to: activeSlide.link })}
                                    variant="contained"
                                    endIcon={<OpenIcon sx={{ fontSize: 14 }} />}
                                    sx={{
                                        bgcolor: 'var(--primary-color, #e94560)',
                                        color: '#ffffff',
                                        '&:hover': {
                                            bgcolor: 'var(--primary-hover-color, #d63447)',
                                            transform: 'translateY(-2px)'
                                        },
                                        transition: 'all 0.25s ease',
                                        borderRadius: '50px',
                                        px: 2.8,
                                        py: 0.6,
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    {t("home.explore", "Explore More")}
                                </Button>
                            </Box>
                        )}

                        {/* Real-time Blog Search Box */}
                        <SearchBox
                            placeholder={t("home.search", "Search blogs, topics, authors...")}
                            variant="outlined"
                            size="small"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchOutlined sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }} />
                                        </InputAdornment>
                                    )
                                }
                            }}
                        />
                    </HeroContent>

                    {/* Slider Navigation Arrows (only if multiple slides exist) */}
                    {slides.length > 1 && (
                        <>
                            <IconButton
                                onClick={() => setCurrentSlideIdx(prev => (prev - 1 + slides.length) % slides.length)}
                                aria-label="Previous Slide"
                                sx={{
                                    position: 'absolute',
                                    left: { xs: 6, sm: 16 },
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    zIndex: 3,
                                    color: '#fff',
                                    bgcolor: 'rgba(0, 0, 0, 0.35)',
                                    backdropFilter: 'blur(4px)',
                                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.65)' },
                                    width: { xs: 30, sm: 38 },
                                    height: { xs: 30, sm: 38 }
                                }}
                            >
                                <PrevIcon sx={{ fontSize: { xs: 15, sm: 18 } }} />
                            </IconButton>

                            <IconButton
                                onClick={() => setCurrentSlideIdx(prev => (prev + 1) % slides.length)}
                                aria-label="Next Slide"
                                sx={{
                                    position: 'absolute',
                                    right: { xs: 6, sm: 16 },
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    zIndex: 3,
                                    color: '#fff',
                                    bgcolor: 'rgba(0, 0, 0, 0.35)',
                                    backdropFilter: 'blur(4px)',
                                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.65)' },
                                    width: { xs: 30, sm: 38 },
                                    height: { xs: 30, sm: 38 }
                                }}
                            >
                                <NextIcon sx={{ fontSize: { xs: 15, sm: 18 } }} />
                            </IconButton>

                            {/* Pagination Indicators Dots */}
                            <Stack
                                direction="row"
                                spacing={0.8}
                                sx={{
                                    position: 'absolute',
                                    bottom: 8,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    zIndex: 3
                                }}
                            >
                                {slides.map((_, idx) => (
                                    <Box
                                        key={`dot-${idx}`}
                                        onClick={() => setCurrentSlideIdx(idx)}
                                        sx={{
                                            width: idx === currentSlideIdx ? 18 : 6,
                                            height: 6,
                                            borderRadius: '3px',
                                            bgcolor: idx === currentSlideIdx ? 'var(--primary-color, #e94560)' : 'rgba(255, 255, 255, 0.45)',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            '&:hover': { bgcolor: 'var(--primary-hover-color, #ff8a9e)' }
                                        }}
                                    />
                                ))}
                            </Stack>
                        </>
                    )}
                </HeroContainer>

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

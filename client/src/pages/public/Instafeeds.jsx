import React, { useEffect, useState, useRef, useCallback } from "react";
import {
    Box,
    Container,
    Typography,
    IconButton,
    Button,
    Card,
    CardMedia,
    Stack,
    styled,
    Skeleton,
    Tooltip
} from "@mui/material";
import {
    Instagram as InstagramIcon,
    ArrowBackIosNew as ArrowBackIcon,
    ArrowForwardIos as ArrowForwardIcon,
    PlayArrow as PlayIcon,
    OpenInNew as OpenInNewIcon,
    Favorite as HeartIcon
} from "@mui/icons-material";
import { fetchInstafeeds } from "../../api/public.api.js";
import { useLanguage } from "../../context/LanguageContext";
import { useSettings } from "../../context/SettingsContext";

// Styled Components
const SectionWrapper = styled(Box)(({ theme }) => ({
    padding: '60px 0 70px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #f1f5f9',
    position: 'relative',
    overflow: 'hidden'
}));

const InstaGradientText = styled('span')({
    background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: 800,
});

const InstaBadge = styled(Box)({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 14px',
    borderRadius: '30px',
    background: 'linear-gradient(45deg, rgba(240, 148, 51, 0.1) 0%, rgba(220, 39, 67, 0.1) 50%, rgba(188, 24, 136, 0.1) 100%)',
    border: '1px solid rgba(220, 39, 67, 0.2)',
    fontSize: '0.78rem',
    fontWeight: 700,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    marginBottom: '12px',
    color: '#dc2743'
});

const SliderContainer = styled(Box)({
    display: 'flex',
    gap: '20px',
    overflowX: 'auto',
    scrollSnapType: 'x mandatory',
    scrollBehavior: 'smooth',
    padding: '12px 4px 24px',
    scrollbarWidth: 'none', // Firefox
    '&::-webkit-scrollbar': {
        display: 'none', // Chrome, Safari, Opera
    },
    cursor: 'grab',
    '&:active': {
        cursor: 'grabbing'
    }
});

const SlideCard = styled(Card)(({ theme }) => ({
    flex: '0 0 280px',
    maxWidth: '280px',
    height: '340px',
    borderRadius: '16px',
    scrollSnapAlign: 'start',
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid rgba(226, 232, 240, 0.8)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    backgroundColor: '#0f172a',
    [theme.breakpoints.down('sm')]: {
        flex: '0 0 240px',
        maxWidth: '240px',
        height: '300px',
    },
    '&:hover': {
        transform: 'translateY(-6px)',
        boxShadow: '0 16px 32px rgba(220, 39, 67, 0.18)',
        borderColor: 'rgba(220, 39, 67, 0.4)',
        '& .insta-overlay': {
            opacity: 1,
            visibility: 'visible',
        },
        '& .insta-media': {
            transform: 'scale(1.08)',
        },
        '& .insta-video-badge': {
            opacity: 0,
        }
    }
}));

const Overlay = styled(Box)({
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.6) 45%, rgba(15, 23, 42, 0.2) 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '18px',
    opacity: 0,
    visibility: 'hidden',
    transition: 'all 0.3s ease-in-out',
    zIndex: 2,
    color: '#ffffff',
});

const NavButton = styled(IconButton)(({ theme }) => ({
    backgroundColor: '#ffffff',
    color: '#1e293b',
    border: '1px solid #e2e8f0',
    width: 44,
    height: 44,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
    transition: 'all 0.25s ease',
    '&:hover': {
        backgroundColor: '#dc2743',
        color: '#ffffff',
        borderColor: '#dc2743',
        transform: 'scale(1.06)',
        boxShadow: '0 6px 16px rgba(220, 39, 67, 0.3)'
    },
    '&.Mui-disabled': {
        opacity: 0.35,
        backgroundColor: '#f8fafc',
        borderColor: '#e2e8f0'
    }
}));

const FollowButton = styled(Button)({
    background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '0.875rem',
    borderRadius: '30px',
    padding: '8px 22px',
    textTransform: 'none',
    boxShadow: '0 4px 14px rgba(220, 39, 67, 0.35)',
    transition: 'all 0.3s ease',
    '&:hover': {
        background: 'linear-gradient(45deg, #e08322 0%, #d5572b 25%, #cb1632 50%, #bb1255 75%, #ab0777 100%)',
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 20px rgba(220, 39, 67, 0.45)',
    }
});

const InstaFeeds = () => {
    const { t } = useLanguage();
    const { get_setting } = useSettings();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [isHovered, setIsHovered] = useState(false);

    const sliderRef = useRef(null);
    const isDraggingRef = useRef(false);
    const startXRef = useRef(0);
    const scrollLeftRef = useRef(0);

    // Profile URL from settings or default
    const instagramLink = get_setting('instagram_link') || 'https://www.instagram.com/';

    // Fetch Instagram posts
    const fetchInstagramFeed = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetchInstafeeds();
            if (response?.success && Array.isArray(response.data) && response.data.length > 0) {
                setPosts(response.data);
            } else {
                setPosts([]);
            }
        } catch (err) {
            console.error("Instagram Feed Error:", err);
            setError(err.response?.data?.message || err.message || "Failed to fetch Instagram feeds");
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInstagramFeed();
    }, []);

    // Update arrow buttons active state on scroll
    const updateScrollBounds = useCallback(() => {
        if (!sliderRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
        setCanScrollLeft(scrollLeft > 5);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }, []);

    useEffect(() => {
        const slider = sliderRef.current;
        if (!slider) return;
        slider.addEventListener('scroll', updateScrollBounds);
        updateScrollBounds();
        return () => slider.removeEventListener('scroll', updateScrollBounds);
    }, [posts, updateScrollBounds]);

    // Manual navigation
    const handleScroll = (direction) => {
        if (!sliderRef.current) return;
        const scrollAmount = 300 * 2; // scroll 2 cards at a time
        sliderRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    // Auto-scroll loop
    useEffect(() => {
        if (posts.length <= 3 || isHovered) return;

        const interval = setInterval(() => {
            if (!sliderRef.current) return;
            const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;

            // If reached the end, smoothly wrap back to start
            if (scrollLeft >= scrollWidth - clientWidth - 10) {
                sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                sliderRef.current.scrollBy({ left: 300, behavior: 'smooth' });
            }
        }, 4500);

        return () => clearInterval(interval);
    }, [posts.length, isHovered]);

    // Mouse drag scrolling support
    const handleMouseDown = (e) => {
        if (!sliderRef.current) return;
        isDraggingRef.current = true;
        startXRef.current = e.pageX - sliderRef.current.offsetLeft;
        scrollLeftRef.current = sliderRef.current.scrollLeft;
    };

    const handleMouseMove = (e) => {
        if (!isDraggingRef.current || !sliderRef.current) return;
        e.preventDefault();
        const x = e.pageX - sliderRef.current.offsetLeft;
        const walk = (x - startXRef.current) * 1.5;
        sliderRef.current.scrollLeft = scrollLeftRef.current - walk;
    };

    const handleMouseUpOrLeave = () => {
        isDraggingRef.current = false;
    };

    // Format ISO date string
    const formatDate = (isoString) => {
        if (!isoString) return '';
        try {
            const date = new Date(isoString);
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return '';
        }
    };

    // If loading
    if (loading) {
        return (
            <SectionWrapper>
                <Container maxWidth="xl">
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                        <Box>
                            <Skeleton variant="rounded" width={140} height={28} sx={{ mb: 1, borderRadius: 4 }} />
                            <Skeleton variant="text" width={260} height={40} />
                        </Box>
                        <Stack direction="row" spacing={1}>
                            <Skeleton variant="circular" width={40} height={40} />
                            <Skeleton variant="circular" width={40} height={40} />
                        </Stack>
                    </Box>
                    <Box display="flex" gap={2} overflow="hidden">
                        {[1, 2, 3, 4, 5].map((item) => (
                            <Skeleton
                                key={item}
                                variant="rounded"
                                width={280}
                                height={340}
                                sx={{ borderRadius: 4, flexShrink: 0 }}
                            />
                        ))}
                    </Box>
                </Container>
            </SectionWrapper>
        );
    }

    // If disabled, error, or no posts, don't show empty block
    if (error || !posts || posts.length === 0) {
        return null;
    }

    return (
        <SectionWrapper>
            <Container maxWidth="xl">
                {/* Header Section */}
                <Box
                    display="flex"
                    flexDirection={{ xs: 'column', md: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', md: 'flex-end' }}
                    gap={2}
                    mb={3.5}
                >
                    <Box>
                        <InstaBadge>
                            <InstagramIcon sx={{ fontSize: 16 }} />
                            {t("Instagram Feed", "Instagram Feed")}
                        </InstaBadge>
                        <Typography
                            variant="h4"
                            component="h2"
                            fontWeight={800}
                            color="#0f172a"
                            sx={{
                                fontSize: { xs: '1.75rem', sm: '2.1rem', md: '2.35rem' },
                                letterSpacing: '-0.5px',
                                mb: 0.5
                            }}
                        >
                            {t("Follow Us On", "Follow Us On")}{" "}
                            <InstaGradientText>Instagram</InstaGradientText>
                        </Typography>
                        <Typography variant="body2" color="#64748b" fontWeight={500}>
                            {t("Discover our latest stories, reels & community moments", "Discover our latest stories, reels & community moments")}
                        </Typography>
                    </Box>

                    {/* Right Action Controls: Follow Button + Slider Arrows */}
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <FollowButton
                            component="a"
                            href={instagramLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            startIcon={<InstagramIcon />}
                        >
                            {t("Follow Us", "Follow Us")}
                        </FollowButton>

                        <NavButton
                            onClick={() => handleScroll('left')}
                            disabled={!canScrollLeft}
                            aria-label="Previous posts"
                            size="small"
                        >
                            <ArrowBackIcon sx={{ fontSize: 18 }} />
                        </NavButton>

                        <NavButton
                            onClick={() => handleScroll('right')}
                            disabled={!canScrollRight}
                            aria-label="Next posts"
                            size="small"
                        >
                            <ArrowForwardIcon sx={{ fontSize: 18 }} />
                        </NavButton>
                    </Stack>
                </Box>

                {/* Slider Horizontal Track */}
                <SliderContainer
                    ref={sliderRef}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => {
                        setIsHovered(false);
                        handleMouseUpOrLeave();
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUpOrLeave}
                >
                    {posts.map((post) => {
                        const isVideo = post.media_type === "VIDEO";
                        const imageUrl = isVideo ? (post.thumbnail_url || post.media_url) : post.media_url;
                        const dateFormatted = formatDate(post.timestamp);
                        const caption = post.caption || "";

                        return (
                            <SlideCard
                                key={post.id}
                                component="a"
                                href={post.permalink || instagramLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ textDecoration: 'none' }}
                            >
                                {/* Media Image / Video Thumbnail */}
                                <CardMedia
                                    component="img"
                                    className="insta-media"
                                    image={imageUrl}
                                    alt={caption || "Instagram post"}
                                    onError={(e) => {
                                        // Fallback if media url fails
                                        e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
                                    }}
                                    sx={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                />

                                {/* Top Right Video Indicator Badge */}
                                {isVideo && (
                                    <Box
                                        className="insta-video-badge"
                                        sx={{
                                            position: 'absolute',
                                            top: 14,
                                            right: 14,
                                            width: 34,
                                            height: 34,
                                            borderRadius: '50%',
                                            backgroundColor: 'rgba(15, 23, 42, 0.65)',
                                            backdropFilter: 'blur(8px)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#ffffff',
                                            zIndex: 1,
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                                            transition: 'opacity 0.2s ease',
                                        }}
                                    >
                                        <PlayIcon sx={{ fontSize: 20 }} />
                                    </Box>
                                )}

                                {/* Hover Dark Glassmorphism Overlay */}
                                <Overlay className="insta-overlay">
                                    {/* Top Bar with Instagram icon and permalink */}
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Box
                                            sx={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: '50%',
                                                background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#ffffff',
                                                boxShadow: '0 4px 12px rgba(220, 39, 67, 0.4)'
                                            }}
                                        >
                                            <InstagramIcon sx={{ fontSize: 20 }} />
                                        </Box>
                                        <Tooltip title={t("View on Instagram", "View on Instagram")}>
                                            <Box
                                                sx={{
                                                    color: 'rgba(255, 255, 255, 0.85)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                                    backdropFilter: 'blur(6px)',
                                                    px: 1.2,
                                                    py: 0.4,
                                                    borderRadius: '12px'
                                                }}
                                            >
                                                <OpenInNewIcon sx={{ fontSize: 14 }} />
                                            </Box>
                                        </Tooltip>
                                    </Box>

                                    {/* Center Heart Icon on hover */}
                                    <Box
                                        display="flex"
                                        justifyContent="center"
                                        alignItems="center"
                                        sx={{ my: 'auto' }}
                                    >
                                        <HeartIcon
                                            sx={{
                                                fontSize: 48,
                                                color: '#ffffff',
                                                filter: 'drop-shadow(0 4px 12px rgba(220, 39, 67, 0.6))',
                                                opacity: 0.9,
                                                transform: 'scale(1)',
                                                transition: 'transform 0.25s ease',
                                                '&:hover': {
                                                    transform: 'scale(1.2)'
                                                }
                                            }}
                                        />
                                    </Box>

                                    {/* Bottom Content: Caption & Date */}
                                    <Box>
                                        {caption ? (
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: 'rgba(255, 255, 255, 0.92)',
                                                    fontSize: '0.8rem',
                                                    lineHeight: 1.45,
                                                    fontWeight: 500,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    mb: 0.75,
                                                }}
                                            >
                                                {caption}
                                            </Typography>
                                        ) : (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: 'rgba(255, 255, 255, 0.8)',
                                                    fontStyle: 'italic',
                                                    display: 'block',
                                                    mb: 0.75
                                                }}
                                            >
                                                {t("View post on Instagram", "View post on Instagram")}
                                            </Typography>
                                        )}

                                        {dateFormatted && (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: 'rgba(255, 255, 255, 0.6)',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 600,
                                                    display: 'block',
                                                    letterSpacing: '0.3px'
                                                }}
                                            >
                                                {dateFormatted}
                                            </Typography>
                                        )}
                                    </Box>
                                </Overlay>
                            </SlideCard>
                        );
                    })}
                </SliderContainer>
            </Container>
        </SectionWrapper>
    );
};

export default InstaFeeds;
import React, { useState, useEffect, useContext } from 'react';
import {
    styled,
    Box,
    Button,
    TextField,
    Typography,
    Select,
    MenuItem,
    FormControl,
    FormHelperText,
    Alert,
    AlertTitle,
    Paper,
    Stack,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    CircularProgress,
    Chip,
    Container
} from '@mui/material';
import {
    ExpandMore,
    ArticleOutlined,
    LockOpenRounded,
    ShoppingBagOutlined,
    ArrowBack,
    SaveOutlined,
    PublishOutlined,
    CategoryOutlined,
    ImageOutlined,
    AutoAwesomeOutlined,
    DescriptionOutlined
} from '@mui/icons-material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from '../../i18n/i18n';
import { API } from '../../service/api';
import { DataContext } from '../../context/DataProvider';
import { useAuth } from '../../context/AuthContext';
import AizUploaderInput from '../uploader/AizUploaderInput';
import AizTextEditor from '../editor/AizTextEditor';
import PublicLayout from '../../layouts/PublicLayout';
import { toast } from '../../utils/toast';

const PageWrapper = styled(Box)`
    padding: 36px 0 80px;
    background-color: #f8fafc;
    min-height: 85vh;
`;

const HeaderBox = styled(Box)`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;
    background: #ffffff;
    padding: 24px 32px;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);

    @media (max-width: 600px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
        padding: 20px;
    }
`;

const SectionCard = styled(Paper)`
    padding: 28px 32px;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.02);
    margin-bottom: 24px;
    background: #ffffff;
`;

const SectionTitle = styled(Typography)`
    font-size: 18px;
    fontWeight: 800;
    color: #1a1a2e;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
`;

const FormLabelText = styled(Typography)`
    font-size: 14px;
    font-weight: 700;
    color: #334155;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
`;

const generateSlug = (value) => {
    return (value || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
};

const CreatePost = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { account } = useContext(DataContext);
    const { user, role, isAuthenticated, isLoading: authLoading } = useAuth();
    const { t, i18n } = useTranslation();
    const lang = i18n.language || 'en';

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            toast.warning("Please log in to create a blog post.");
            navigate('/login');
        }
    }, [authLoading, isAuthenticated, navigate]);

    const isRegularUser = (role === 'user' || account?.role === 'user');

    const [categories, setCategories] = useState([]);
    const [loadingCats, setLoadingCats] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Tracks if user manually typed in auto-generated fields
    const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
    const [isMetaTitleEdited, setIsMetaTitleEdited] = useState(false);
    const [isMetaImgEdited, setIsMetaImgEdited] = useState(false);
    const [isMetaDescEdited, setIsMetaDescEdited] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        category_id: '',
        slug: '',
        banner: '',
        picture: '',
        short_description: '',
        description: '',
        meta_title: '',
        meta_img: '',
        meta_description: '',
        meta_keywords: '',
        status: 1
    });

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const preselectedCatId = queryParams.get('category_id');
        const preselectedCat = queryParams.get('category');

        const fetchCategories = async () => {
            setLoadingCats(true);
            try {
                if (isRegularUser) {
                    const res = await API.getUserPurchasedCategories();
                    if (res.isSuccess) {
                        const list = res.data?.categories || res.data || [];
                        const validList = Array.isArray(list) ? list : [];
                        setCategories(validList);

                        if (validList.length > 0) {
                            const match = validList.find(c => c._id === preselectedCatId || c.slug === preselectedCat || c.name === preselectedCat);
                            if (match) {
                                setFormData(prev => ({ ...prev, category_id: match._id }));
                            }
                        }
                    }
                } else {
                    const res = await API.getCategories();
                    if (res.isSuccess) {
                        const list = res.data?.categories || res.data || [];
                        const validList = Array.isArray(list) ? list : [];
                        setCategories(validList);

                        if (validList.length > 0 && (preselectedCatId || preselectedCat)) {
                            const match = validList.find(c => c._id === preselectedCatId || c.slug === preselectedCat || c.name === preselectedCat);
                            if (match) {
                                setFormData(prev => ({ ...prev, category_id: match._id }));
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to load categories:', err);
            } finally {
                setLoadingCats(false);
            }
        };

        fetchCategories();
    }, [isRegularUser, location.search]);

    // Handle Title change & Auto-generate Slug & Meta Title
    const handleTitleChange = (e) => {
        const val = e.target.value;
        setFormData(prev => {
            const nextSlug = !isSlugManuallyEdited ? generateSlug(val) : prev.slug;
            const nextMetaTitle = !isMetaTitleEdited ? val : prev.meta_title;
            return {
                ...prev,
                title: val,
                slug: nextSlug,
                meta_title: nextMetaTitle
            };
        });
        setErrors(prev => ({ ...prev, title: '', slug: '' }));
    };

    // Handle Slug manual change
    const handleSlugChange = (e) => {
        setIsSlugManuallyEdited(true);
        setFormData(prev => ({ ...prev, slug: e.target.value }));
        setErrors(prev => ({ ...prev, slug: '' }));
    };

    // Handle Banner change & Auto-generate Meta Image
    const handleBannerChange = (url) => {
        setFormData(prev => {
            const nextMetaImg = !isMetaImgEdited ? url : prev.meta_img;
            return {
                ...prev,
                banner: url,
                picture: url,
                meta_img: nextMetaImg
            };
        });
        setErrors(prev => ({ ...prev, banner: '' }));
    };

    // Handle Short Description change & Auto-generate Meta Description
    const handleShortDescChange = (e) => {
        const val = e.target.value;
        setFormData(prev => {
            const nextMetaDesc = !isMetaDescEdited ? val : prev.meta_description;
            return {
                ...prev,
                short_description: val,
                meta_description: nextMetaDesc
            };
        });
        setErrors(prev => ({ ...prev, short_description: '' }));
    };

    // Handle Description (Rich Text Editor) change
    const handleDescriptionChange = (html) => {
        setFormData(prev => ({ ...prev, description: html }));
        setErrors(prev => ({ ...prev, description: '' }));
    };

    // Validation for all fields
    const validateForm = () => {
        let errs = {};
        if (!formData.title?.trim()) {
            errs.title = t("post.errTitle", "Blog Title is required");
        }
        if (!formData.category_id) {
            errs.category_id = t("post.errCategory", "Category selection is required");
        }
        if (!formData.slug?.trim()) {
            errs.slug = t("post.errSlug", "Slug is required");
        }
        if (!formData.banner?.trim()) {
            errs.banner = t("post.errBanner", "Banner cover image is required");
        }
        if (!formData.short_description?.trim()) {
            errs.short_description = t("post.errShortDesc", "Short description is required");
        }

        const plainTextDesc = (formData.description || '').replace(/<[^>]+>/g, '').trim();
        if (!plainTextDesc) {
            errs.description = t("post.errDesc", "Detailed blog content (Description) is required");
        }

        if (isRegularUser && categories.length === 0) {
            errs.category_id = t("post.errMustPurchase", "You must purchase a category license to publish blogs.");
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSave = async (publish) => {
        if (!validateForm()) {
            toast.error(t("post.validationFail", "Please fill in all required fields."));
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                published: publish,
                status: publish ? 1 : 0
            };

            const res = await API.createPost(payload);
            if (res.isSuccess) {
                toast.success(publish ? t("post.publishedToast", "Blog published successfully!") : t("post.draftToast", "Draft saved successfully!"));
                navigate('/dashboard');
            } else {
                toast.error(res.msg || res.data?.message || t("post.createError", "Failed to create blog post."));
            }
        } catch (err) {
            console.error('Save blog error:', err);
            toast.error("An unexpected error occurred while saving your post.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PublicLayout>
            <PageWrapper>
                <Container maxWidth="lg">
                    {/* Header */}
                    <HeaderBox>
                        <Box>
                            <Typography variant="h5" fontWeight={800} color="#1a1a2e" display="flex" alignItems="center" gap={1.5}>
                                <ArticleOutlined sx={{ fontSize: 32, color: '#e94560' }} />
                                {t("post.createTitle", "Write a New Story")}
                            </Typography>
                            <Typography variant="body2" color="#64748b" mt={0.5}>
                                {t("post.createSubtitle", "Draft your article with rich typography, formatted media, and auto-generated SEO metadata.")}
                            </Typography>
                        </Box>

                        <Button
                            component={RouterLink}
                            to="/dashboard"
                            startIcon={<ArrowBack />}
                            variant="outlined"
                            sx={{
                                borderRadius: '10px',
                                textTransform: 'none',
                                fontWeight: 600,
                                color: '#1a1a2e',
                                borderColor: '#cbd5e1',
                                '&:hover': { borderColor: '#1a1a2e', bgcolor: '#f8fafc' }
                            }}
                        >
                            {t("post.backToDashboard", "My Dashboard")}
                        </Button>
                    </HeaderBox>

                    {/* Category License Required Alert for Regular Users */}
                    {isRegularUser && !loadingCats && categories.length === 0 && (
                        <Alert
                            severity="warning"
                            icon={<ShoppingBagOutlined sx={{ fontSize: 28 }} />}
                            sx={{
                                mb: 3.5,
                                borderRadius: 3,
                                p: 2.5,
                                border: '1px solid #fde68a',
                                backgroundColor: '#fffbeb'
                            }}
                            action={
                                <Button
                                    component={RouterLink}
                                    to="/dashboard?tab=categories"
                                    variant="contained"
                                    color="warning"
                                    size="small"
                                    startIcon={<LockOpenRounded />}
                                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                                >
                                    {t("post.unlockCategoriesBtn", "Unlock Categories ($10)")}
                                </Button>
                            }
                        >
                            <AlertTitle sx={{ fontWeight: 800, fontSize: '16px' }}>
                                {t("post.noCategoriesTitle", "Category License Required")}
                            </AlertTitle>
                            {t("post.noCategoriesDesc", "You do not own any category authoring licenses yet. You can only write and publish blogs in categories you have unlocked.")}
                        </Alert>
                    )}

                    {/* SECTION 1: CORE DETAILS */}
                    <SectionCard>
                        <SectionTitle>
                            <ArticleOutlined sx={{ color: '#2563eb' }} />
                            {t("post.generalInfo", "Article Information")}
                        </SectionTitle>

                        <Stack spacing={3}>
                            {/* Blog Title */}
                            <Box>
                                <FormLabelText>
                                    {t("post.labelTitle", "Blog Title *")}
                                </FormLabelText>
                                <TextField
                                    fullWidth
                                    placeholder={t("post.placeholderTitle", "e.g., The Future of Web Development in 2026")}
                                    value={formData.title}
                                    onChange={handleTitleChange}
                                    error={Boolean(errors.title)}
                                    helperText={errors.title}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            backgroundColor: '#ffffff'
                                        }
                                    }}
                                />
                            </Box>

                            {/* Category & Slug Row */}
                            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2.5}>
                                {/* Category Dropdown */}
                                <Box>
                                    <FormLabelText>
                                        <CategoryOutlined sx={{ fontSize: 16, color: '#059669' }} />
                                        {t("post.labelCategory", "Category *")}
                                    </FormLabelText>
                                    <FormControl fullWidth error={Boolean(errors.category_id)}>
                                        <Select
                                            value={formData.category_id}
                                            displayEmpty
                                            onChange={(e) => {
                                                setFormData(prev => ({ ...prev, category_id: e.target.value }));
                                                setErrors(prev => ({ ...prev, category_id: '' }));
                                            }}
                                            disabled={isRegularUser && categories.length === 0}
                                            sx={{ borderRadius: 2 }}
                                        >
                                            <MenuItem value="" disabled>
                                                {loadingCats ? t("post.loadingCategories", "Loading categories...") : t("post.selectCategory", "Select a Category")}
                                            </MenuItem>
                                            {categories.map(cat => {
                                                const catName = cat.name?.[lang] || cat.name?.en || cat.name;
                                                return (
                                                    <MenuItem key={cat._id} value={cat._id}>
                                                        {isRegularUser ? `✅ ${catName}` : catName}
                                                    </MenuItem>
                                                );
                                            })}
                                        </Select>
                                        {errors.category_id && <FormHelperText>{errors.category_id}</FormHelperText>}
                                        {isRegularUser && categories.length > 0 && (
                                            <FormHelperText sx={{ color: '#059669', fontWeight: 600 }}>
                                                {t("post.purchasedHint", "Showing categories you have unlocked")}
                                            </FormHelperText>
                                        )}
                                    </FormControl>
                                </Box>

                                {/* Slug (Auto-Generated) */}
                                <Box>
                                    <FormLabelText>
                                        <AutoAwesomeOutlined sx={{ fontSize: 16, color: '#7c3aed' }} />
                                        {t("post.labelSlug", "URL Slug * (Auto-Generated)")}
                                    </FormLabelText>
                                    <TextField
                                        fullWidth
                                        placeholder="url-friendly-slug"
                                        value={formData.slug}
                                        onChange={handleSlugChange}
                                        error={Boolean(errors.slug)}
                                        helperText={errors.slug || t("post.slugHelp", "Generated automatically from title; editable if desired.")}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                backgroundColor: '#ffffff'
                                            }
                                        }}
                                    />
                                </Box>
                            </Box>

                            {/* Banner Image */}
                            <Box>
                                <FormLabelText>
                                    <ImageOutlined sx={{ fontSize: 16, color: '#d97706' }} />
                                    {t("post.labelBanner", "Cover Banner Image * (1300x650 recommended)")}
                                </FormLabelText>
                                <AizUploaderInput
                                    value={formData.banner}
                                    onChange={handleBannerChange}
                                    type="image"
                                    placeholder={t("post.chooseBanner", "Choose Cover Banner Image")}
                                />
                                {errors.banner && (
                                    <Typography color="error" variant="caption" sx={{ mt: 0.8, display: 'block' }}>
                                        {errors.banner}
                                    </Typography>
                                )}
                            </Box>

                            {/* Short Description */}
                            <Box>
                                <FormLabelText>
                                    <DescriptionOutlined sx={{ fontSize: 16, color: '#2563eb' }} />
                                    {t("post.labelShortDesc", "Short Description *")}
                                </FormLabelText>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    placeholder={t("post.placeholderShortDesc", "Provide a compelling summary of this post (1-2 sentences)...")}
                                    value={formData.short_description}
                                    onChange={handleShortDescChange}
                                    error={Boolean(errors.short_description)}
                                    helperText={errors.short_description}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            backgroundColor: '#ffffff'
                                        }
                                    }}
                                />
                            </Box>
                        </Stack>
                    </SectionCard>

                    {/* SECTION 2: RICH TEXT EDITOR (DESCRIPTION) */}
                    <SectionCard>
                        <SectionTitle>
                            <AutoAwesomeOutlined sx={{ color: '#7c3aed' }} />
                            {t("post.detailedStory", "Full Story & Content * (Rich Text Editor)")}
                        </SectionTitle>
                        <Typography variant="body2" color="#64748b" mb={2}>
                            {t("post.editorHint", "Use the toolbar to style your content with bold text, headings, lists, quotes, links, and inline images.")}
                        </Typography>

                        <Box sx={{ border: errors.description ? '1.5px solid #ef4444' : 'none', borderRadius: 2 }}>
                            <AizTextEditor
                                value={formData.description}
                                onChange={handleDescriptionChange}
                                placeholder={t("post.writeStoryPlaceholder", "Tell your story here...")}
                            />
                        </Box>
                        {errors.description && (
                            <Typography color="error" variant="caption" sx={{ mt: 0.8, display: 'block', fontWeight: 600 }}>
                                {errors.description}
                            </Typography>
                        )}
                    </SectionCard>

                    {/* SECTION 3: SEO & SOCIAL PREVIEW (AUTO-POPULATED) */}
                    <Accordion
                        defaultExpanded={false}
                        sx={{
                            borderRadius: '16px !important',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.02)',
                            mb: 4,
                            '&:before': { display: 'none' }
                        }}
                    >
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box display="flex" alignItems="center" gap={1.5}>
                                <AutoAwesomeOutlined sx={{ color: '#059669' }} />
                                <Typography variant="subtitle1" fontWeight={700} color="#1a1a2e">
                                    {t("post.seoSettings", "SEO & Social Sharing Metadata (Auto-Generated)")}
                                </Typography>
                                <Chip size="small" label="Auto-Filled" color="success" sx={{ fontSize: '11px', fontWeight: 700 }} />
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 3, pt: 1 }}>
                            <Typography variant="body2" color="#64748b" mb={3}>
                                {t("post.seoHint", "These fields are automatically populated from your Title, Banner, and Short Description to boost search engine indexing. You may adjust them manually if desired.")}
                            </Typography>

                            <Stack spacing={2.5}>
                                {/* Meta Title */}
                                <Box>
                                    <FormLabelText>{t("post.metaTitle", "Meta Title")}</FormLabelText>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Meta Title"
                                        value={formData.meta_title}
                                        onChange={(e) => {
                                            setIsMetaTitleEdited(true);
                                            setFormData(prev => ({ ...prev, meta_title: e.target.value }));
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Box>

                                {/* Meta Image */}
                                <Box>
                                    <FormLabelText>{t("post.metaImage", "Meta Image / OG Image")}</FormLabelText>
                                    <AizUploaderInput
                                        value={formData.meta_img}
                                        onChange={(url) => {
                                            setIsMetaImgEdited(true);
                                            setFormData(prev => ({ ...prev, meta_img: url }));
                                        }}
                                        type="image"
                                        placeholder="Choose Meta Image"
                                    />
                                </Box>

                                {/* Meta Description */}
                                <Box>
                                    <FormLabelText>{t("post.metaDescription", "Meta Description")}</FormLabelText>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={2}
                                        size="small"
                                        placeholder="Meta Description for search engines..."
                                        value={formData.meta_description}
                                        onChange={(e) => {
                                            setIsMetaDescEdited(true);
                                            setFormData(prev => ({ ...prev, meta_description: e.target.value }));
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Box>

                                {/* Meta Keywords */}
                                <Box>
                                    <FormLabelText>{t("post.metaKeywords", "Keywords (comma separated)")}</FormLabelText>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="e.g. tech, coding, web dev, innovation"
                                        value={formData.meta_keywords}
                                        onChange={(e) => setFormData(prev => ({ ...prev, meta_keywords: e.target.value }))}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                </Box>
                            </Stack>
                        </AccordionDetails>
                    </Accordion>

                    {/* ACTION FOOTER */}
                    <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2}>
                        <Button
                            variant="outlined"
                            color="inherit"
                            disabled={submitting}
                            onClick={() => navigate('/dashboard')}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 3,
                                py: 1.2
                            }}
                        >
                            {t("post.cancel", "Cancel")}
                        </Button>

                        <Button
                            variant="outlined"
                            color="primary"
                            disabled={submitting || (isRegularUser && categories.length === 0)}
                            startIcon={<SaveOutlined />}
                            onClick={() => handleSave(false)}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 700,
                                px: 3,
                                py: 1.2
                            }}
                        >
                            {t("post.saveDraft", "Save Draft")}
                        </Button>

                        <Button
                            variant="contained"
                            disabled={submitting || (isRegularUser && categories.length === 0)}
                            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <PublishOutlined />}
                            onClick={() => handleSave(true)}
                            sx={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: '#ffffff',
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 700,
                                px: 4,
                                py: 1.2,
                                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                                }
                            }}
                        >
                            {submitting ? t("post.publishing", "Publishing...") : t("post.publish", "Publish Blog")}
                        </Button>
                    </Box>
                </Container>
            </PageWrapper>
        </PublicLayout>
    );
};

export default CreatePost;
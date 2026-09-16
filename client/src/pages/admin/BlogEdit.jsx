import React, {
    useState,
    useEffect,
    useCallback,
} from 'react';

import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Stack,
    FormControl,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
} from '@mui/material';

import {
    useParams,
    useNavigate,
} from 'react-router-dom';

import LanguageTabBar from '../../components/common/LanguageTabBar';

import AizUploaderInput from '../../components/uploader/AizUploaderInput';

import AizTextEditor from '../../components/editor/AizTextEditor';

import {
    fetchAdminBlogById,
    fetchAdminCategories,
    updateBlog,
} from '../../api/admin.api';

import {
    useLanguage,
} from '../../context/LanguageContext';

import { toast } from '../../utils/toast';


/**
 * =========================================================
 * COMMON INPUT STYLE
 * =========================================================
 */
const inputSx = {
    '& .MuiOutlinedInput-root': {
        minHeight: '64px',
        borderRadius: '6px',
        backgroundColor: '#ffffff',

        '& fieldset': {
            borderColor: '#d9dde5',
            borderWidth: '1px',
        },

        '&:hover fieldset': {
            borderColor: '#c7ccd5',
        },

        '&.Mui-focused fieldset': {
            borderColor: '#aeb5c0',
            borderWidth: '1px',
        },
    },

    '& .MuiInputBase-input': {
        fontSize: '18px',
        color: '#707783',
        padding: '0 24px',
    },

    '& .MuiInputBase-input::placeholder': {
        color: '#858b98',
        opacity: 1,
    },

    '& .MuiFormHelperText-root': {
        marginLeft: 0,
        marginTop: '7px',
        fontSize: '13px',
        color: '#687385',
    },
};


/**
 * =========================================================
 * SELECT STYLE
 * =========================================================
 */
const selectSx = {
    minHeight: '64px',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    fontSize: '18px',
    color: '#707783',

    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#d9dde5',
        borderWidth: '1px',
    },

    '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: '#c7ccd5',
    },

    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#aeb5c0',
        borderWidth: '1px',
    },

    '& .MuiSelect-select': {
        padding: '18px 24px',
        minHeight: 'unset',
        display: 'flex',
        alignItems: 'center',
    },
};


/**
 * =========================================================
 * REUSABLE FORM FIELD ROW
 * =========================================================
 *
 * Desktop:
 *
 * Label                Input
 * 180px                Remaining width
 *
 *
 * Mobile:
 *
 * Label
 * Input
 */
const FormFieldRow = ({
    label,
    children,
    alignItems = 'center',
    helperText,
}) => {
    return (
        <Box
            sx={{
                display: 'grid',

                gridTemplateColumns: {
                    xs: '1fr',
                    sm: '180px minmax(0, 1fr)',
                },

                columnGap: {
                    xs: 0,
                    sm: 2,
                },

                alignItems,

                width: '100%',
            }}
        >
            {/* Label */}

            <Box
                sx={{
                    minWidth: 0,

                    mb: {
                        xs: 1,
                        sm: 0,
                    },
                }}
            >
                <Typography
                    sx={{
                        fontSize: '16px',
                        fontWeight: 400,
                        lineHeight: 1.5,
                        color: '#202431',
                    }}
                >
                    {label}
                </Typography>
            </Box>


            {/* Field */}

            <Box
                sx={{
                    minWidth: 0,
                    width: '100%',
                }}
            >
                {children}

                {helperText && (
                    <Typography
                        sx={{
                            fontSize: '13px',
                            lineHeight: 1.4,
                            color: '#687385',
                            mt: 0.75,
                        }}
                    >
                        {helperText}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};


const BlogEdit = () => {
    const {
        id,
    } = useParams();

    const navigate =
        useNavigate();

    const {
        t,
        currentLang,
        languages,
    } = useLanguage();


    /**
     * =========================================================
     * LANGUAGE
     * =========================================================
     */

    const [
        selectedLang,
        setSelectedLang,
    ] = useState(
        currentLang || 'en'
    );


    /**
     * =========================================================
     * STATES
     * =========================================================
     */

    const [
        categories,
        setCategories,
    ] = useState([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        alertMessage,
        setAlertMessage,
    ] = useState({
        type: 'info',
        text: '',
    });


    /**
     * =========================================================
     * FORM DATA
     * =========================================================
     */

    const initialFormState = {
        title: '',
        category_id: '',
        slug: '',
        banner: '',
        short_description: '',
        description: '',
        meta_title: '',
        meta_img: '',
        meta_description: '',
        meta_keywords: '',
        status: 1,
    };

    const [
        formData,
        setFormData,
    ] = useState(
        initialFormState
    );


    /**
     * =========================================================
     * LANGUAGES
     * =========================================================
     */




    /**
     * =========================================================
     * UPDATE FIELD
     * =========================================================
     */

    const updateField = (
        field,
        value
    ) => {
        setFormData(
            (prev) => ({
                ...prev,
                [field]: value,
            })
        );
    };


    /**
     * =========================================================
     * LOAD BLOG
     * =========================================================
     */

    const loadBlog =
        useCallback(
            async (
                langCode
            ) => {
                setLoading(true);

                setAlertMessage({
                    type: 'info',
                    text: '',
                });

                try {
                    const [
                        blogRes,
                        catRes,
                    ] =
                        await Promise.all([
                            fetchAdminBlogById(
                                id,
                                langCode
                            ),

                            fetchAdminCategories({
                                lang: langCode,
                            }),
                        ]);


                    /**
                     * -----------------------------------------
                     * BLOG
                     * -----------------------------------------
                     */

                    if (
                        blogRes &&
                        (
                            blogRes.data ||
                            blogRes.blog ||
                            blogRes.post
                        )
                    ) {
                        const blog =
                            blogRes.data ||
                            blogRes.blog ||
                            blogRes.post;

                        setFormData({
                            title:
                                blog.title ||
                                '',

                            category_id:
                                blog.category_id ||
                                blog.category?._id ||
                                blog.category?.id ||
                                '',

                            slug:
                                blog.slug ||
                                '',

                            banner:
                                blog.banner ||
                                '',

                            short_description:
                                blog.short_description ||
                                '',

                            description:
                                blog.description ||
                                '',

                            meta_title:
                                blog.meta_title ||
                                '',

                            meta_img:
                                blog.meta_img ||
                                '',

                            meta_description:
                                blog.meta_description ||
                                '',

                            meta_keywords:
                                blog.meta_keywords ||
                                '',

                            status:
                                blog.status !==
                                    undefined
                                    ? blog.status
                                    : 1,
                        });
                    } else {
                        setAlertMessage({
                            type: 'error',
                            text: t(
                                'Blog not found',
                                'Blog not found'
                            ),
                        });
                    }


                    /**
                     * -----------------------------------------
                     * CATEGORIES
                     * -----------------------------------------
                     */

                    if (
                        catRes?.categories
                    ) {
                        setCategories(
                            catRes.categories
                        );
                    }
                } catch (
                err
                ) {
                    console.error(
                        'Failed to load blog:',
                        err
                    );

                    setAlertMessage({
                        type: 'error',
                        text: t(
                            'Failed to load blog details',
                            'Failed to load blog details'
                        ),
                    });
                } finally {
                    setLoading(false);
                }
            },
            [
                id,
                t,
            ]
        );


    /**
     * =========================================================
     * LOAD BLOG ON INITIAL LOAD / LANGUAGE CHANGE
     * =========================================================
     */

    useEffect(() => {
        loadBlog(
            selectedLang
        );
    }, [
        selectedLang,
        loadBlog,
    ]);


    /**
     * =========================================================
     * SAVE / UPDATE BLOG
     * =========================================================
     */

    const handleSaveBlog =
        async (e) => {
            e.preventDefault();


            /**
             * Validate title
             */

            if (
                !formData.title.trim()
            ) {
                const msg = t('Blog Title is required', 'Blog Title is required');
                setAlertMessage({
                    type: 'error',
                    text: msg,
                });
                toast.warning(msg);
                return;
            }


            /**
             * Validate category
             */

            if (
                !formData.category_id
            ) {
                const msg = t('Category is required', 'Category is required');
                setAlertMessage({
                    type: 'error',
                    text: msg,
                });
                toast.warning(msg);
                return;
            }


            /**
             * Validate slug
             */

            if (
                !formData.slug.trim()
            ) {
                const msg = t('Slug is required', 'Slug is required');
                setAlertMessage({
                    type: 'error',
                    text: msg,
                });
                toast.warning(msg);
                return;
            }


            setSaving(true);

            setAlertMessage({
                type: 'info',
                text: '',
            });


            try {
                const payload = {
                    ...formData,
                    lang:
                        selectedLang,
                };

                await updateBlog(
                    id,
                    payload
                );

                const successMsg = t('Blog has been updated successfully', 'Blog has been updated successfully');
                setAlertMessage({
                    type: 'success',
                    text: successMsg,
                });
                toast.success(successMsg);


                /**
                 * Redirect after update
                 */

                setTimeout(() => {
                    navigate(
                        '/admin/blogs'
                    );
                }, 800);
            } catch (
            err
            ) {
                console.error(
                    'Failed to update blog:',
                    err
                );

                const errorMsg = err?.response?.data?.message || t('Failed to update blog', 'Failed to update blog');
                setAlertMessage({
                    type: 'error',
                    text: errorMsg,
                });
                toast.error(errorMsg);
            } finally {
                setSaving(false);
            }
        };


    /**
     * =========================================================
     * RESET
     *
     * On edit page reset means reload original data.
     * =========================================================
     */

    const handleReset =
        () => {
            loadBlog(
                selectedLang
            );
        };


    /**
     * =========================================================
     * RENDER
     * =========================================================
     */

    return (
        <Box
            sx={{
                minHeight:
                    '100vh',

                backgroundColor:
                    '#f7f8fa',

                px: {
                    xs: 1.5,
                    sm: 2,
                    md: 3,
                },

                py: {
                    xs: 2,
                    sm: 2.5,
                    md: 3,
                },

                pb: 6,
            }}
        >
            {/* =================================================
                MAIN CONTENT
            ================================================== */}

            <Box
                sx={{
                    width: '100%',
                    maxWidth: '920px',
                    mx: 'auto',
                }}
            >
                {/* =================================================
                    ALERT
                ================================================== */}

                {alertMessage.text && (
                    <Alert
                        severity={
                            alertMessage.type
                        }
                        onClose={() =>
                            setAlertMessage({
                                type: 'info',
                                text: '',
                            })
                        }
                        sx={{
                            mb: 2,
                            borderRadius:
                                '6px',
                        }}
                    >
                        {
                            alertMessage.text
                        }
                    </Alert>
                )}


                {/* =================================================
                    MAIN CARD
                ================================================== */}

                <Paper
                    elevation={0}
                    sx={{
                        width: '100%',

                        backgroundColor:
                            '#ffffff',

                        border:
                            '1px solid #e1e5ea',

                        borderRadius:
                            '12px',

                        overflow:
                            'hidden',
                    }}
                >
                    {/* =================================================
                        HEADER
                    ================================================== */}

                    <Box
                        sx={{
                            minHeight:
                                '74px',

                            display:
                                'flex',

                            alignItems:
                                'center',

                            px: {
                                xs: 2.5,
                                sm: 3,
                                md: 4.5,
                            },

                            borderBottom:
                                '1px solid #e5e7eb',
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: {
                                    xs: '20px',
                                    sm: '22px',
                                    md: '24px',
                                },

                                fontWeight: 400,

                                lineHeight: 1.3,

                                color:
                                    '#202431',
                            }}
                        >
                            {t(
                                'Blog Information',
                                'Blog Information'
                            )}
                        </Typography>
                    </Box>


                    {/* =================================================
                        LANGUAGE TABS
                    ================================================== */}

                    <Box
                        sx={{
                            px: {
                                xs: 2,
                                sm: 3,
                                md: 4.5,
                            },

                            pt: 2.5,

                            pb: 0.5,
                        }}
                    >
                        <LanguageTabBar
                            activeLang={selectedLang}
                            onLangChange={(code) => setSelectedLang(code)}
                        />
                    </Box>


                    {/* =================================================
                        LOADING
                    ================================================== */}

                    {loading ? (
                        <Box
                            sx={{
                                display:
                                    'flex',

                                justifyContent:
                                    'center',

                                alignItems:
                                    'center',

                                minHeight:
                                    '320px',
                            }}
                        >
                            <CircularProgress
                                size={30}
                            />
                        </Box>
                    ) : (
                        <Box
                            component="form"
                            onSubmit={
                                handleSaveBlog
                            }
                            sx={{
                                px: {
                                    xs: 2,
                                    sm: 3,
                                    md: 4.5,
                                },

                                py: {
                                    xs: 3,
                                    sm: 3.5,
                                    md: 4,
                                },
                            }}
                        >
                            <Stack
                                spacing={{
                                    xs: 2.5,
                                    sm: 3,
                                }}
                            >

                                {/* =================================================
                                    BLOG TITLE
                                ================================================== */}

                                <FormFieldRow
                                    label={t(
                                        'Blog Title',
                                        'Blog Title'
                                    )}
                                >
                                    <TextField
                                        fullWidth
                                        placeholder={t(
                                            'Blog Title',
                                            'Blog Title'
                                        )}
                                        value={
                                            formData.title
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            updateField(
                                                'title',
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        required
                                        sx={
                                            inputSx
                                        }
                                    />
                                </FormFieldRow>


                                {/* =================================================
                                    CATEGORY
                                ================================================== */}

                                <FormFieldRow
                                    label={t(
                                        'Category',
                                        'Category'
                                    )}
                                >
                                    <FormControl
                                        fullWidth
                                        required
                                    >
                                        <Select
                                            value={
                                                formData.category_id
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                updateField(
                                                    'category_id',
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
                                            displayEmpty
                                            sx={
                                                selectSx
                                            }
                                            renderValue={(
                                                selected
                                            ) => {
                                                if (
                                                    !selected
                                                ) {
                                                    return (
                                                        <Typography
                                                            sx={{
                                                                fontSize:
                                                                    '18px',
                                                                color:
                                                                    '#858b98',
                                                            }}
                                                        >
                                                            {t(
                                                                'Please Choose...',
                                                                'Please Choose...'
                                                            )}
                                                        </Typography>
                                                    );
                                                }

                                                const selectedCategory =
                                                    categories.find(
                                                        (
                                                            category
                                                        ) =>
                                                            (
                                                                category._id ||
                                                                category.id
                                                            ) ===
                                                            selected
                                                    );

                                                return (
                                                    selectedCategory?.name ||
                                                    selected
                                                );
                                            }}
                                        >
                                            <MenuItem value="">
                                                <em>
                                                    {t(
                                                        'Please Choose...',
                                                        'Please Choose...'
                                                    )}
                                                </em>
                                            </MenuItem>

                                            {categories.map(
                                                (
                                                    category
                                                ) => {
                                                    const categoryId =
                                                        category._id ||
                                                        category.id;

                                                    return (
                                                        <MenuItem
                                                            key={
                                                                categoryId
                                                            }
                                                            value={
                                                                categoryId
                                                            }
                                                        >
                                                            {
                                                                category.name
                                                            }
                                                        </MenuItem>
                                                    );
                                                }
                                            )}
                                        </Select>
                                    </FormControl>
                                </FormFieldRow>


                                {/* =================================================
                                    SLUG
                                ================================================== */}

                                <FormFieldRow
                                    label={t(
                                        'Slug',
                                        'Slug'
                                    )}
                                >
                                    <TextField
                                        fullWidth
                                        placeholder={t(
                                            'Slug',
                                            'Slug'
                                        )}
                                        value={
                                            formData.slug
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            updateField(
                                                'slug',
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        required
                                        sx={
                                            inputSx
                                        }
                                    />
                                </FormFieldRow>


                                {/* =================================================
                                    BANNER
                                ================================================== */}

                                <FormFieldRow
                                    label={t(
                                        'Banner (1300x650)',
                                        'Banner (1300x650)'
                                    )}
                                    alignItems="start"
                                    helperText={t(
                                        'Recommended dimensions: 1300px width X 650px height.',
                                        'Recommended dimensions: 1300px width X 650px height.'
                                    )}
                                >
                                    <Box
                                        sx={{
                                            width:
                                                '100%',
                                        }}
                                    >
                                        <AizUploaderInput
                                            value={
                                                formData.banner
                                            }
                                            onChange={(
                                                url
                                            ) =>
                                                updateField(
                                                    'banner',
                                                    url
                                                )
                                            }
                                            type="image"
                                            placeholder={t(
                                                'Choose File',
                                                'Choose File'
                                            )}
                                            helperText=""
                                        />
                                    </Box>
                                </FormFieldRow>


                                {/* =================================================
                                    SHORT DESCRIPTION
                                ================================================== */}

                                <FormFieldRow
                                    label={t(
                                        'Short Description',
                                        'Short Description'
                                    )}
                                    alignItems="start"
                                >
                                    <TextField
                                        fullWidth
                                        multiline
                                        minRows={
                                            3
                                        }
                                        placeholder={t(
                                            'Short Description',
                                            'Short Description'
                                        )}
                                        value={
                                            formData.short_description
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            updateField(
                                                'short_description',
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        required
                                        sx={{
                                            ...inputSx,

                                            '& .MuiOutlinedInput-root':
                                            {
                                                minHeight:
                                                    '120px',

                                                alignItems:
                                                    'flex-start',
                                            },

                                            '& .MuiInputBase-input':
                                            {
                                                padding:
                                                    '18px 24px',
                                            },
                                        }}
                                    />
                                </FormFieldRow>


                                {/* =================================================
                                    DESCRIPTION
                                ================================================== */}

                                <FormFieldRow
                                    label={t(
                                        'Description',
                                        'Description'
                                    )}
                                    alignItems="start"
                                >
                                    <Box
                                        sx={{
                                            width:
                                                '100%',
                                        }}
                                    >
                                        <AizTextEditor
                                            value={
                                                formData.description
                                            }
                                            onChange={(
                                                html
                                            ) =>
                                                updateField(
                                                    'description',
                                                    html
                                                )
                                            }
                                            placeholder={t(
                                                'Write blog content here...',
                                                'Write blog content here...'
                                            )}
                                            name="description"
                                        />
                                    </Box>
                                </FormFieldRow>


                                {/* =================================================
                                    META TITLE
                                ================================================== */}

                                <FormFieldRow
                                    label={t(
                                        'Meta Title',
                                        'Meta Title'
                                    )}
                                >
                                    <TextField
                                        fullWidth
                                        placeholder={t(
                                            'Meta Title',
                                            'Meta Title'
                                        )}
                                        value={
                                            formData.meta_title
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            updateField(
                                                'meta_title',
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        sx={
                                            inputSx
                                        }
                                    />
                                </FormFieldRow>


                                {/* =================================================
                                    META IMAGE
                                ================================================== */}

                                <FormFieldRow
                                    label={t(
                                        'Meta Image (200x200)',
                                        'Meta Image (200x200)'
                                    )}
                                    alignItems="start"
                                    helperText={t(
                                        'Recommended dimensions: 200px width X 200px height.',
                                        'Recommended dimensions: 200px width X 200px height.'
                                    )}
                                >
                                    <Box
                                        sx={{
                                            width:
                                                '100%',
                                        }}
                                    >
                                        <AizUploaderInput
                                            value={
                                                formData.meta_img
                                            }
                                            onChange={(
                                                url
                                            ) =>
                                                updateField(
                                                    'meta_img',
                                                    url
                                                )
                                            }
                                            type="image"
                                            placeholder={t(
                                                'Choose File',
                                                'Choose File'
                                            )}
                                            helperText=""
                                        />
                                    </Box>
                                </FormFieldRow>


                                {/* =================================================
                                    META DESCRIPTION
                                ================================================== */}

                                <FormFieldRow
                                    label={t(
                                        'Meta description',
                                        'Meta description'
                                    )}
                                    alignItems="start"
                                >
                                    <TextField
                                        fullWidth
                                        multiline
                                        minRows={
                                            3
                                        }
                                        placeholder={t(
                                            'Meta description',
                                            'Meta description'
                                        )}
                                        value={
                                            formData.meta_description
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            updateField(
                                                'meta_description',
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        sx={{
                                            ...inputSx,

                                            '& .MuiOutlinedInput-root':
                                            {
                                                minHeight:
                                                    '120px',

                                                alignItems:
                                                    'flex-start',
                                            },

                                            '& .MuiInputBase-input':
                                            {
                                                padding:
                                                    '18px 24px',
                                            },
                                        }}
                                    />
                                </FormFieldRow>


                                {/* =================================================
                                    META KEYWORDS
                                ================================================== */}

                                <FormFieldRow
                                    label={t(
                                        'Meta Keywords',
                                        'Meta Keywords'
                                    )}
                                >
                                    <TextField
                                        fullWidth
                                        placeholder={t(
                                            'Meta Keywords',
                                            'Meta Keywords'
                                        )}
                                        value={
                                            formData.meta_keywords
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            updateField(
                                                'meta_keywords',
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        sx={
                                            inputSx
                                        }
                                    />
                                </FormFieldRow>


                                {/* =================================================
                                    ACTION BUTTONS
                                ================================================== */}

                                <Box
                                    sx={{
                                        display:
                                            'flex',

                                        justifyContent:
                                            'flex-end',

                                        alignItems:
                                            'center',

                                        gap: 1.5,

                                        pt: 1,
                                    }}
                                >
                                    {/* SAVE */}

                                    <Button
                                        type="submit"
                                        variant="outlined"
                                        disabled={
                                            saving
                                        }
                                        startIcon={
                                            saving ? (
                                                <CircularProgress
                                                    size={
                                                        16
                                                    }
                                                />
                                            ) : null
                                        }
                                        sx={{
                                            minWidth:
                                                '76px',

                                            height:
                                                '42px',

                                            px: 2,

                                            borderRadius:
                                                '4px',

                                            textTransform:
                                                'none',

                                            fontSize:
                                                '14px',

                                            fontWeight:
                                                400,

                                            color:
                                                '#f59e0b',

                                            borderColor:
                                                '#f59e0b',

                                            '&:hover':
                                            {
                                                borderColor:
                                                    '#d97706',

                                                backgroundColor:
                                                    'rgba(245, 158, 11, 0.05)',
                                            },

                                            '&.Mui-disabled':
                                            {
                                                color:
                                                    '#c7cbd1',

                                                borderColor:
                                                    '#d9dde5',
                                            },
                                        }}
                                    >
                                        {saving
                                            ? t(
                                                'Saving...',
                                                'Saving...'
                                            )
                                            : t(
                                                'Save',
                                                'Save'
                                            )}
                                    </Button>


                                    {/* RESET */}

                                    <Button
                                        type="button"
                                        variant="outlined"
                                        disabled={
                                            saving
                                        }
                                        onClick={
                                            handleReset
                                        }
                                        sx={{
                                            minWidth:
                                                '76px',

                                            height:
                                                '42px',

                                            px: 2,

                                            borderRadius:
                                                '4px',

                                            textTransform:
                                                'none',

                                            fontSize:
                                                '14px',

                                            fontWeight:
                                                400,

                                            color:
                                                '#ef4444',

                                            borderColor:
                                                '#ef4444',

                                            '&:hover':
                                            {
                                                borderColor:
                                                    '#dc2626',

                                                backgroundColor:
                                                    'rgba(239, 68, 68, 0.05)',
                                            },

                                            '&.Mui-disabled':
                                            {
                                                color:
                                                    '#c7cbd1',

                                                borderColor:
                                                    '#d9dde5',
                                            },
                                        }}
                                    >
                                        {t(
                                            'Reset',
                                            'Reset'
                                        )}
                                    </Button>
                                </Box>
                            </Stack>
                        </Box>
                    )}
                </Paper>
            </Box>
        </Box>
    );
};

export default BlogEdit;
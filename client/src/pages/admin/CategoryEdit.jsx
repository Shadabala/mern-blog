import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useParams, useNavigate } from 'react-router-dom';

import LanguageTabBar from '../../components/common/LanguageTabBar';
import AizUploaderInput from '../../components/uploader/AizUploaderInput';
import {
    fetchAdminCategoryById,
    fetchAdminCategories,
    updateCategory,
} from '../../api/admin.api';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../utils/toast';

/**
 * =========================================================
 * COMMON TEXT FIELD STYLE
 * =========================================================
 *
 * This style matches the Category Create UI.
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
 * REUSABLE FORM ROW
 * =========================================================
 *
 * Desktop:
 * Label     = 180px
 * Input     = remaining width
 *
 * Mobile:
 * Label is displayed above input.
 */
const FormFieldRow = ({
    label,
    children,
    helperText,
    alignItems = 'center',
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

            {/* Input */}
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

const CategoryEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();

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
    const [selectedLang, setSelectedLang] = useState(
        currentLang || 'en'
    );

    /**
     * =========================================================
     * DATA STATES
     * =========================================================
     */
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [alertMessage, setAlertMessage] = useState({
        type: 'info',
        text: '',
    });

    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    /**
     * =========================================================
     * INITIAL FORM STATE
     * =========================================================
     */
    const initialFormState = {
        name: '',
        type: 'Physical',
        parent_id: '',
        order_level: 0,
        banner: '',
        icon: '',
        cover_image: '',
        meta_title: '',
        meta_description: '',
        slug: '',
    };

    const [formData, setFormData] = useState(initialFormState);



    /**
     * =========================================================
     * UPDATE SINGLE FIELD
     * =========================================================
     */
    const updateField = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    /**
     * =========================================================
     * LOAD CATEGORY
     * =========================================================
     */
    const loadCategory = useCallback(
        async (langCode) => {
            setLoading(true);
            setAlertMessage({
                type: 'info',
                text: '',
            });

            try {
                const [catRes, allCatsRes] = await Promise.all([
                    fetchAdminCategoryById(id, {
                        lang: langCode,
                    }),
                    fetchAdminCategories({
                        lang: langCode,
                    }),
                ]);

                if (!isMountedRef.current) return;

                /**
                 * Load selected category
                 */
                if (catRes?.success && catRes.category) {
                    const c = catRes.category;

                    setFormData({
                        name: c.translated_name || c.name || '',
                        type: c.type || 'Physical',
                        parent_id: c.parent_id?._id || c.parent_id || '',
                        order_level: c.order_level ?? 0,
                        banner: c.banner || '',
                        icon: c.icon || '',
                        cover_image: c.cover_image || '',
                        meta_title: c.meta_title || '',
                        meta_description: c.meta_description || '',
                        slug: c.slug || '',
                    });
                } else {
                    setAlertMessage({
                        type: 'error',
                        text: t(
                            'Category not found',
                            'Category not found'
                        ),
                    });
                }

                /**
                 * Load parent categories
                 */
                if (allCatsRes?.success && Array.isArray(allCatsRes.categories)) {
                    setCategories(allCatsRes.categories);
                } else if (Array.isArray(allCatsRes?.data)) {
                    setCategories(allCatsRes.data);
                }
            } catch (err) {
                if (!isMountedRef.current) return;

                console.error('Failed to load category:', err);

                setAlertMessage({
                    type: 'error',
                    text: t(
                        'Failed to load category',
                        'Failed to load category'
                    ),
                });
            } finally {
                if (isMountedRef.current) {
                    setLoading(false);
                }
            }
        },
        [id, t]
    );

    /**
     * =========================================================
     * LOAD CATEGORY WHEN LANGUAGE CHANGES
     * =========================================================
     */
    useEffect(() => {
        loadCategory(selectedLang);
    }, [selectedLang, loadCategory]);

    /**
     * =========================================================
     * SAVE / UPDATE CATEGORY
     * =========================================================
     */
    const handleSaveCategory = async (e) => {
        e.preventDefault();

        /**
         * Validate category name
         */
        if (!formData.name.trim()) {
            const msg = t('Category name is required', 'Category name is required');
            setAlertMessage({
                type: 'error',
                text: msg,
            });
            toast.warning(msg);
            return;
        }

        /**
         * Prevent self-referencing parent
         */
        if (formData.parent_id && String(formData.parent_id) === String(id)) {
            const msg = t('A category cannot be its own parent', 'A category cannot be its own parent');
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
                order_level:
                    formData.order_level === ''
                        ? 0
                        : Number(formData.order_level),
                parent_id: formData.parent_id || null,
                lang: selectedLang,
            };

            await updateCategory(id, payload);

            if (!isMountedRef.current) return;

            const successMsg = t('Category has been updated successfully', 'Category has been updated successfully');
            setAlertMessage({
                type: 'success',
                text: successMsg,
            });
            toast.success(successMsg);

            /**
             * Redirect after successful update
             */
            setTimeout(() => {
                if (isMountedRef.current) {
                    navigate('/admin/categories');
                }
            }, 800);
        } catch (err) {
            if (!isMountedRef.current) return;

            console.error('Failed to update category:', err);

            const errorMsg = err?.response?.data?.message || t('Failed to update category', 'Failed to update category');
            setAlertMessage({
                type: 'error',
                text: errorMsg,
            });
            toast.error(errorMsg);
        } finally {
            if (isMountedRef.current) {
                setSaving(false);
            }
        }
    };

    /**
     * =========================================================
     * RESET
     * =========================================================
     *
     * For Edit page, reset means reload the original
     * category data from the API.
     */
    const handleReset = () => {
        loadCategory(selectedLang);
    };

    /**
     * =========================================================
     * RENDER
     * =========================================================
     */
    return (
        <Box
            sx={{
                minHeight: '100vh',
                backgroundColor: '#f7f8fa',
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
                        severity={alertMessage.type}
                        onClose={() =>
                            setAlertMessage({
                                type: 'info',
                                text: '',
                            })
                        }
                        sx={{
                            mb: 2,
                            borderRadius: '6px',
                        }}
                    >
                        {alertMessage.text}
                    </Alert>
                )}

                {/* =================================================
                    MAIN CARD
                ================================================== */}
                <Paper
                    elevation={0}
                    sx={{
                        width: '100%',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e1e5ea',
                        borderRadius: '12px',
                        overflow: 'hidden',
                    }}
                >
                    {/* =================================================
                        HEADER
                    ================================================== */}
                    <Box
                        sx={{
                            minHeight: '74px',
                            display: 'flex',
                            alignItems: 'center',
                            px: {
                                xs: 2.5,
                                sm: 3,
                                md: 4.5,
                            },
                            borderBottom: '1px solid #e5e7eb',
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
                                color: '#202431',
                            }}
                        >
                            {t(
                                'Category Information',
                                'Category Information'
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
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                minHeight: '300px',
                            }}
                        >
                            <CircularProgress size={30} />
                        </Box>
                    ) : (
                        /* =================================================
                            FORM
                        ================================================== */
                        <Box
                            component="form"
                            onSubmit={handleSaveCategory}
                        // sx={{
                        //     px: {
                        //         xs: 2,
                        //         sm: 3,
                        //         md: 4.5,
                        //     },
                        //     py: {
                        //         xs: 3,
                        //         sm: 3.5,
                        //         md: 4,
                        //     },
                        // }}
                        >
                            <Stack
                                spacing={{
                                    xs: 2.5,
                                    sm: 3,
                                }}
                            >
                                {/* =================================================
                                    NAME
                                ================================================== */}
                                <FormFieldRow label={t('Name', 'Name')}>
                                    <TextField
                                        fullWidth
                                        placeholder={t('Name', 'Name')}
                                        value={formData.name}
                                        onChange={(e) =>
                                            updateField('name', e.target.value)
                                        }
                                        required
                                        sx={inputSx}
                                    />
                                </FormFieldRow>

                                {/* =================================================
                                    PARENT CATEGORY
                                ================================================== */}
                                <FormFieldRow
                                    label={t(
                                        'Parent Category',
                                        'Parent Category'
                                    )}
                                >
                                    <FormControl fullWidth>
                                        <Select
                                            displayEmpty
                                            value={formData.parent_id || ''}
                                            onChange={(e) =>
                                                updateField(
                                                    'parent_id',
                                                    e.target.value
                                                )
                                            }
                                            sx={selectSx}
                                            renderValue={(selected) => {
                                                if (!selected) {
                                                    return (
                                                        <Typography
                                                            sx={{
                                                                fontSize: '18px',
                                                                color: '#858b98',
                                                            }}
                                                        >
                                                            {t(
                                                                'No Parent',
                                                                'No Parent'
                                                            )}
                                                        </Typography>
                                                    );
                                                }

                                                const selectedCategory =
                                                    categories.find(
                                                        (category) =>
                                                            String(
                                                                category._id ||
                                                                category.id
                                                            ) ===
                                                            String(selected)
                                                    );

                                                return (
                                                    selectedCategory?.name ||
                                                    selected
                                                );
                                            }}
                                        >
                                            {/* No Parent */}
                                            <MenuItem value="">
                                                <em>
                                                    {t(
                                                        'No Parent',
                                                        'No Parent'
                                                    )}
                                                </em>
                                            </MenuItem>

                                            {/* Categories (filter out self) */}
                                            {categories
                                                .filter(
                                                    (category) =>
                                                        String(
                                                            category._id ||
                                                            category.id
                                                        ) !== String(id)
                                                )
                                                .map((category) => {
                                                    const categoryId =
                                                        category._id ||
                                                        category.id;

                                                    return (
                                                        <MenuItem
                                                            key={categoryId}
                                                            value={categoryId}
                                                        >
                                                            {category.name}
                                                        </MenuItem>
                                                    );
                                                })}
                                        </Select>
                                    </FormControl>
                                </FormFieldRow>

                                {/* =================================================
                                    ORDERING NUMBER
                                ================================================== */}
                                <FormFieldRow
                                    label={t(
                                        'Ordering Number',
                                        'Ordering Number'
                                    )}
                                    alignItems="start"
                                    helperText={t(
                                        'Higher number has high priority',
                                        'Higher number has high priority'
                                    )}
                                >
                                    <TextField
                                        fullWidth
                                        type="number"
                                        placeholder={t(
                                            'Order Level',
                                            'Order Level'
                                        )}
                                        value={formData.order_level ?? ''}
                                        onChange={(e) =>
                                            updateField(
                                                'order_level',
                                                e.target.value
                                            )
                                        }
                                        sx={inputSx}
                                    />
                                </FormFieldRow>

                                {/* =================================================
                                    ICON
                                ================================================== */}
                                <FormFieldRow
                                    label={t('Icon', 'Icon')}
                                    alignItems="start"
                                    helperText={t(
                                        'Minimum dimensions required: 16px width X 16px height.',
                                        'Minimum dimensions required: 16px width X 16px height.'
                                    )}
                                >
                                    <Box
                                        className="category-uploader"
                                        sx={{ width: '100%' }}
                                    >
                                        <AizUploaderInput
                                            value={formData.icon}
                                            onChange={(url) =>
                                                updateField('icon', url)
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
                                    META TITLE
                                ================================================== */}
                                <FormFieldRow
                                    label={t('Meta Title', 'Meta Title')}
                                    alignItems="start"
                                >
                                    <TextField
                                        fullWidth
                                        placeholder={t(
                                            'Meta Title',
                                            'Meta Title'
                                        )}
                                        value={formData.meta_title}
                                        onChange={(e) =>
                                            updateField(
                                                'meta_title',
                                                e.target.value
                                            )
                                        }
                                        sx={inputSx}
                                    />
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
                                        minRows={3}
                                        placeholder={t(
                                            'Meta description',
                                            'Meta description'
                                        )}
                                        value={formData.meta_description}
                                        onChange={(e) =>
                                            updateField(
                                                'meta_description',
                                                e.target.value
                                            )
                                        }
                                        sx={{
                                            ...inputSx,
                                            '& .MuiOutlinedInput-root': {
                                                minHeight: '120px',
                                                alignItems: 'flex-start',
                                            },
                                            '& .MuiInputBase-input': {
                                                padding: '18px 24px',
                                            },
                                        }}
                                    />
                                </FormFieldRow>

                                {/* =================================================
                                    SLUG
                                ================================================== */}
                                <FormFieldRow
                                    label={t('Slug', 'Slug')}
                                    alignItems="start"
                                >
                                    <TextField
                                        fullWidth
                                        placeholder={t('Slug', 'Slug')}
                                        value={formData.slug}
                                        onChange={(e) =>
                                            updateField('slug', e.target.value)
                                        }
                                        sx={inputSx}
                                    />
                                </FormFieldRow>

                                {/* =================================================
                                    ACTION BUTTONS
                                ================================================== */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        pt: 1,
                                    }}
                                >
                                    {/* SAVE */}
                                    <Button
                                        type="submit"
                                        variant="outlined"
                                        className="btn-outline-primary"
                                        disabled={saving}
                                        startIcon={
                                            saving ? (
                                                <CircularProgress size={16} />
                                            ) : null
                                        }
                                        sx={{
                                            minWidth: '76px',
                                            height: '42px',
                                            px: 2,
                                            borderRadius: '6px',
                                            textTransform: 'none',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            color: 'var(--primary-color, #2563eb)',
                                            borderColor: 'var(--primary-color, #2563eb)',
                                            backgroundColor: 'transparent',
                                            '&:hover': {
                                                color: '#ffffff',
                                                backgroundColor: 'var(--primary-color, #2563eb)',
                                                borderColor: 'var(--primary-color, #2563eb)'
                                            },
                                            '&:disabled': {
                                                color: 'var(--primary-color, #2563eb)',
                                                borderColor: 'var(--primary-color, #2563eb)',
                                                opacity: 0.6
                                            }
                                        }}
                                    >
                                        {saving
                                            ? t('Saving...', 'Saving...')
                                            : t('Save', 'Save')}
                                    </Button>

                                    {/* RESET */}
                                    <Button
                                        type="button"
                                        variant="outlined"
                                        disabled={saving}
                                        onClick={handleReset}
                                        sx={{
                                            minWidth: '76px',
                                            height: '42px',
                                            px: 2,
                                            borderRadius: '4px',
                                            textTransform: 'none',
                                            fontSize: '14px',
                                            fontWeight: 400,
                                            color: '#ef4444',
                                            borderColor: '#ef4444',

                                            '&:hover': {
                                                borderColor: '#dc2626',
                                                backgroundColor:
                                                    'rgba(239, 68, 68, 0.05)',
                                            },

                                            '&.Mui-disabled': {
                                                color: '#c7cbd1',
                                                borderColor: '#d9dde5',
                                            },
                                        }}
                                    >
                                        {t('Reset', 'Reset')}
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

export default CategoryEdit;
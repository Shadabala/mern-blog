import React, { useEffect, useState } from 'react';
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
import { useNavigate } from 'react-router-dom';

import AizUploaderInput from '../../components/uploader/AizUploaderInput';
import {
    fetchAdminCategories,
    createCategory,
} from '../../api/admin.api';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../utils/toast';

/**
 * Common input styling
 * Matches the large input fields shown in the reference UI.
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
 * Select styling
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
 * Reusable form row.
 *
 * Desktop:
 * Label = 180px
 * Field = remaining width
 *
 * Mobile:
 * Label goes above the field.
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

const CategoryCreate = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [saving, setSaving] = useState(false);

    const [alertMessage, setAlertMessage] = useState({
        type: 'info',
        text: '',
    });

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
     * Generic field updater
     */
    const updateField = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    /**
     * Reset form
     */
    const handleReset = () => {
        setFormData(initialFormState);

        setAlertMessage({
            type: 'info',
            text: '',
        });
    };

    /**
     * Load parent categories
     */
    useEffect(() => {
        let mounted = true;

        const loadCategories = async () => {
            try {
                setLoadingCategories(true);

                const data = await fetchAdminCategories({
                    lang: 'en',
                });

                if (mounted && data?.success) {
                    setCategories(data.categories || []);
                }
            } catch (err) {
                console.error(
                    'Failed to load parent categories:',
                    err
                );

                if (mounted) {
                    setAlertMessage({
                        type: 'error',
                        text: t(
                            'Failed to load parent categories',
                            'Failed to load parent categories'
                        ),
                    });
                }
            } finally {
                if (mounted) {
                    setLoadingCategories(false);
                }
            }
        };

        loadCategories();

        return () => {
            mounted = false;
        };
    }, [t]);

    /**
     * Save category
     */
    const handleSaveCategory = async (e) => {
        e.preventDefault();

        /**
         * Validate name
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

        setSaving(true);

        setAlertMessage({
            type: 'info',
            text: '',
        });

        try {
            const payload = {
                ...formData,
                lang: 'en',
            };

            await createCategory(payload);

            const successMsg = t('Category has been inserted successfully', 'Category has been inserted successfully');
            setAlertMessage({
                type: 'success',
                text: successMsg,
            });
            toast.success(successMsg);

            setTimeout(() => {
                navigate('/admin/categories');
            }, 800);
        } catch (err) {
            console.error(
                'Failed to create category:',
                err
            );

            const errorMsg = err?.response?.data?.message || t('Failed to create category', 'Failed to create category');
            setAlertMessage({
                type: 'error',
                text: errorMsg,
            });
            toast.error(errorMsg);
        } finally {
            setSaving(false);
        }
    };

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
            {/* Main content */}
            <Box
                sx={{
                    width: '100%',
                    maxWidth: '920px',
                    mx: 'auto',
                }}
            >
                {/* Alert */}
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

                {/* Main Card */}
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
                    {/* =========================================
                        CARD HEADER
                    ========================================== */}
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
                                color: '#202431',
                            }}
                        >
                            {t(
                                'Category Information',
                                'Category Information'
                            )}
                        </Typography>
                    </Box>

                    {/* =========================================
                        FORM
                    ========================================== */}
                    <Box
                        component="form"
                        onSubmit={handleSaveCategory}
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
                            {/* =================================
                                NAME
                            ================================== */}
                            <FormFieldRow
                                label={t('Name', 'Name')}
                            >
                                <TextField
                                    fullWidth
                                    placeholder={t(
                                        'Name',
                                        'Name'
                                    )}
                                    value={formData.name}
                                    onChange={(e) =>
                                        updateField(
                                            'name',
                                            e.target.value
                                        )
                                    }
                                    required
                                    sx={inputSx}
                                />
                            </FormFieldRow>

                            {/* =================================
                                PARENT CATEGORY
                            ================================== */}
                            <FormFieldRow
                                label={t(
                                    'Parent Category',
                                    'Parent Category'
                                )}
                            >
                                <FormControl
                                    fullWidth
                                    disabled={
                                        loadingCategories
                                    }
                                >
                                    <Select
                                        displayEmpty
                                        value={
                                            formData.parent_id ||
                                            ''
                                        }
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
                                                            fontSize:
                                                                '18px',
                                                            color: '#858b98',
                                                        }}
                                                    >
                                                        {loadingCategories
                                                            ? t(
                                                                'Loading...',
                                                                'Loading...'
                                                            )
                                                            : t(
                                                                'No Parent',
                                                                'No Parent'
                                                            )}
                                                    </Typography>
                                                );
                                            }

                                            const selectedCategory =
                                                categories.find(
                                                    (category) =>
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
                                                    'No Parent',
                                                    'No Parent'
                                                )}
                                            </em>
                                        </MenuItem>

                                        {categories.map(
                                            (category) => {
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

                            {/* =================================
                                ORDERING NUMBER
                            ================================== */}
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
                                    value={
                                        formData.order_level ??
                                        ''
                                    }
                                    onChange={(e) =>
                                        updateField(
                                            'order_level',
                                            e.target.value
                                        )
                                    }
                                    sx={inputSx}
                                />
                            </FormFieldRow>

                            {/* =================================
                                ICON
                            ================================== */}
                            <FormFieldRow
                                label={t(
                                    'Icon',
                                    'Icon'
                                )}
                                alignItems="start"
                                helperText={t(
                                    'Minimum dimensions required: 16px width X 16px height.',
                                    'Minimum dimensions required: 16px width X 16px height.'
                                )}
                            >
                                <Box
                                    className="category-uploader"
                                    sx={{
                                        width: '100%',
                                    }}
                                >
                                    <AizUploaderInput
                                        value={
                                            formData.icon
                                        }
                                        onChange={(url) =>
                                            updateField(
                                                'icon',
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

                            {/* =================================
                                META TITLE
                            ================================== */}
                            <FormFieldRow
                                label={t(
                                    'Meta Title',
                                    'Meta Title'
                                )}
                                alignItems="start"
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
                                    onChange={(e) =>
                                        updateField(
                                            'meta_title',
                                            e.target.value
                                        )
                                    }
                                    sx={inputSx}
                                />
                            </FormFieldRow>

                            {/* =================================
                                META DESCRIPTION
                            ================================== */}
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
                                    value={
                                        formData.meta_description
                                    }
                                    onChange={(e) =>
                                        updateField(
                                            'meta_description',
                                            e.target.value
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

                            {/* =================================
                                SLUG
                            ================================== */}
                            <FormFieldRow
                                label={t(
                                    'Slug',
                                    'Slug'
                                )}
                                alignItems="start"
                            >
                                <TextField
                                    fullWidth
                                    placeholder={t(
                                        'Slug',
                                        'Slug'
                                    )}
                                    value={formData.slug}
                                    onChange={(e) =>
                                        updateField(
                                            'slug',
                                            e.target.value
                                        )
                                    }
                                    sx={inputSx}
                                />
                            </FormFieldRow>

                            {/* =================================
                                ACTION BUTTONS
                            ================================== */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent:
                                        'flex-end',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    pt: 1,
                                }}
                            >
                                {/* Save */}
                                <Button
                                    type="submit"
                                    variant="outlined"
                                    className="btn-outline-primary"
                                    disabled={saving}
                                    startIcon={
                                        saving ? (
                                            <CircularProgress
                                                size={16}
                                            />
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
                                        ? t(
                                            'Saving...',
                                            'Saving...'
                                        )
                                        : t(
                                            'Save',
                                            'Save'
                                        )}
                                </Button>

                                {/* Reset */}
                                <Button
                                    type="button"
                                    variant="outlined"
                                    disabled={saving}
                                    onClick={
                                        handleReset
                                    }
                                    sx={{
                                        minWidth: '76px',
                                        height: '42px',
                                        px: 2,
                                        borderRadius: '4px',
                                        textTransform:
                                            'none',
                                        fontSize: '14px',
                                        fontWeight: 400,
                                        color: '#ef4444',
                                        borderColor:
                                            '#ef4444',

                                        '&:hover': {
                                            borderColor:
                                                '#dc2626',
                                            backgroundColor:
                                                'rgba(239, 68, 68, 0.05)',
                                        },

                                        '&.Mui-disabled': {
                                            color: '#c7cbd1',
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
                </Paper>
            </Box>
        </Box>
    );
};

export default CategoryCreate;
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Stack,
    Switch,
    FormControlLabel,
    IconButton,
    Paper,
} from '@mui/material';

import {
    Save as SaveIcon,
    Add as AddIcon,
    Close as CloseIcon,
    Facebook as FacebookIcon,
    Twitter as TwitterIcon,
    Instagram as InstagramIcon,
    YouTube as YoutubeIcon,
    LinkedIn as LinkedinIcon,
} from '@mui/icons-material';

import LanguageTabBar from '../../components/common/LanguageTabBar';
import AizUploaderInput from '../../components/uploader/AizUploaderInput';
import AizTextEditor from '../../components/editor/AizTextEditor';

import {
    fetchFooterSettingsApi,
    updateFooterSettingsApi,
} from '../../api/admin.api';

import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../utils/toast';


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

    '& .MuiInputBase-inputMultiline': {
        padding: '18px 24px',
    },
};


const sectionTitleSx = {
    fontSize: '18px',
    fontWeight: 500,
    color: '#202431',
};


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


const SectionHeader = ({ children }) => {
    return (
        <Box
            sx={{
                px: {
                    xs: 2,
                    sm: 3,
                },
                py: 2.25,
                borderBottom: '1px solid #e1e5ea',
            }}
        >
            <Typography sx={sectionTitleSx}>
                {children}
            </Typography>
        </Box>
    );
};


const FooterSettings = () => {
    const { t, currentLang, languages } = useLanguage();

    const [selectedLang, setSelectedLang] = useState(
        currentLang || 'en'
    );

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [alertMessage, setAlertMessage] = useState({
        type: 'info',
        text: '',
    });

    const [form, setForm] = useState({
        footer_logo: '',
        about_us_description: '',
        contact_address: '',
        contact_phone: '',
        contact_email: '',

        widget_one_title: '',
        widget_one_labels: [],
        widget_one_links: [],

        widget_two_title: '',
        widget_two_labels: [],
        widget_two_links: [],

        frontend_copyright_text: '',

        show_social_links: 'on',

        facebook_link: '',
        twitter_link: '',
        instagram_link: '',
        youtube_link: '',
        linkedin_link: '',

        payment_method_images: [],
    });





    useEffect(() => {
        const loadSettings = async () => {
            try {
                setLoading(true);

                const res = await fetchFooterSettingsApi(
                    selectedLang
                );

                if (res?.success && res.settings) {
                    setForm({
                        footer_logo:
                            res.settings.footer_logo || '',

                        about_us_description:
                            res.settings.about_us_description || '',

                        contact_address:
                            res.settings.contact_address || '',

                        contact_phone:
                            res.settings.contact_phone || '',

                        contact_email:
                            res.settings.contact_email || '',

                        widget_one_title:
                            res.settings.widget_one_title || '',

                        widget_one_labels:
                            Array.isArray(
                                res.settings.widget_one_labels
                            )
                                ? res.settings.widget_one_labels
                                : [],

                        widget_one_links:
                            Array.isArray(
                                res.settings.widget_one_links
                            )
                                ? res.settings.widget_one_links
                                : [],

                        widget_two_title:
                            res.settings.widget_two_title || '',

                        widget_two_labels:
                            Array.isArray(
                                res.settings.widget_two_labels
                            )
                                ? res.settings.widget_two_labels
                                : [],

                        widget_two_links:
                            Array.isArray(
                                res.settings.widget_two_links
                            )
                                ? res.settings.widget_two_links
                                : [],

                        frontend_copyright_text:
                            res.settings.frontend_copyright_text || '',

                        show_social_links:
                            res.settings.show_social_links || 'on',

                        facebook_link:
                            res.settings.facebook_link || '',

                        twitter_link:
                            res.settings.twitter_link || '',

                        instagram_link:
                            res.settings.instagram_link || '',

                        youtube_link:
                            res.settings.youtube_link || '',

                        linkedin_link:
                            res.settings.linkedin_link || '',

                        payment_method_images:
                            Array.isArray(
                                res.settings.payment_method_images
                            )
                                ? res.settings.payment_method_images
                                : [],
                    });
                }
            } catch (err) {
                console.error(
                    'Failed to load footer settings:',
                    err
                );

                setAlertMessage({
                    type: 'error',
                    text: t('Failed to load footer settings'),
                });
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, [selectedLang, t]);


    const handleFieldChange = (field, value) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };


    /* =========================
       Widget One
    ========================= */

    const handleAddWidgetOne = () => {
        setForm((prev) => ({
            ...prev,

            widget_one_labels: [
                ...prev.widget_one_labels,
                '',
            ],

            widget_one_links: [
                ...prev.widget_one_links,
                '',
            ],
        }));
    };


    const handleRemoveWidgetOne = (index) => {
        setForm((prev) => ({
            ...prev,

            widget_one_labels:
                prev.widget_one_labels.filter(
                    (_, idx) => idx !== index
                ),

            widget_one_links:
                prev.widget_one_links.filter(
                    (_, idx) => idx !== index
                ),
        }));
    };


    /* =========================
       Widget Two
    ========================= */

    const handleAddWidgetTwo = () => {
        setForm((prev) => ({
            ...prev,

            widget_two_labels: [
                ...prev.widget_two_labels,
                '',
            ],

            widget_two_links: [
                ...prev.widget_two_links,
                '',
            ],
        }));
    };


    const handleRemoveWidgetTwo = (index) => {
        setForm((prev) => ({
            ...prev,

            widget_two_labels:
                prev.widget_two_labels.filter(
                    (_, idx) => idx !== index
                ),

            widget_two_links:
                prev.widget_two_links.filter(
                    (_, idx) => idx !== index
                ),
        }));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);

            setAlertMessage({
                type: 'info',
                text: '',
            });

            await updateFooterSettingsApi({
                ...form,
                lang: selectedLang,
            });

            const successMsg = t(
                'Footer settings updated successfully',
                'Footer settings updated successfully'
            );
            setAlertMessage({
                type: 'success',
                text: successMsg,
            });
            toast.success(successMsg);
        } catch (err) {
            console.error(
                'Failed to update footer settings:',
                err
            );

            const errorMsg =
                err.response?.data?.message ||
                t('Failed to update footer settings', 'Failed to update footer settings');
            setAlertMessage({
                type: 'error',
                text: errorMsg,
            });
            toast.error(errorMsg);
        } finally {
            setSaving(false);
        }
    };


    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: '400px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }


    return (
        <Box
            sx={{
                maxWidth: '920px',
                mx: 'auto',
                px: {
                    xs: 2,
                    sm: 3,
                },
                py: {
                    xs: 2,
                    md: 4,
                },
                pb: 6,
                backgroundColor: '#f7f8fa',
            }}
        >

            {/* =========================
                Language Tabs
            ========================= */}

            <Box sx={{ mb: 2 }}>
                <LanguageTabBar
                    selectedLang={selectedLang}
                    onSelectLang={(code) => setSelectedLang(code)}
                />
            </Box>


            {/* =========================
                Alert
            ========================= */}

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
                        borderRadius: '8px',
                    }}
                >
                    {alertMessage.text}
                </Alert>
            )}


            <form onSubmit={handleSubmit}>

                <Stack spacing={2}>

                    {/* =========================
                        About / Contact
                    ========================= */}

                    <Paper
                        elevation={0}
                        sx={{
                            border: '1px solid #e1e5ea',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            backgroundColor: '#ffffff',
                        }}
                    >
                        <SectionHeader>
                            {t('About Widget')}
                        </SectionHeader>

                        <Stack
                            spacing={2.5}
                            sx={{
                                p: {
                                    xs: 2,
                                    sm: 3,
                                },
                            }}
                        >

                            <FormFieldRow
                                label={t('Footer Logo')}
                            >
                                <AizUploaderInput
                                    value={form.footer_logo}
                                    onChange={(url) =>
                                        handleFieldChange(
                                            'footer_logo',
                                            url
                                        )
                                    }
                                    placeholder={t(
                                        'Choose Footer Logo'
                                    )}
                                />
                            </FormFieldRow>


                            <FormFieldRow
                                label={t('About description')}
                                alignItems="flex-start"
                            >
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    placeholder={t(
                                        'Write a brief description about your website...'
                                    )}
                                    value={
                                        form.about_us_description
                                    }
                                    onChange={(e) =>
                                        handleFieldChange(
                                            'about_us_description',
                                            e.target.value
                                        )
                                    }
                                    sx={{
                                        ...inputSx,

                                        '& .MuiOutlinedInput-root':
                                        {
                                            minHeight:
                                                'unset',
                                        },
                                    }}
                                />
                            </FormFieldRow>


                            <FormFieldRow
                                label={t('Contact address')}
                            >
                                <TextField
                                    fullWidth
                                    placeholder={t(
                                        '123 Street Name, City, Country'
                                    )}
                                    value={
                                        form.contact_address
                                    }
                                    onChange={(e) =>
                                        handleFieldChange(
                                            'contact_address',
                                            e.target.value
                                        )
                                    }
                                    sx={inputSx}
                                />
                            </FormFieldRow>


                            <FormFieldRow
                                label={t('Contact phone')}
                            >
                                <TextField
                                    fullWidth
                                    placeholder="+1 234 567 8900"
                                    value={form.contact_phone}
                                    onChange={(e) =>
                                        handleFieldChange(
                                            'contact_phone',
                                            e.target.value
                                        )
                                    }
                                    sx={inputSx}
                                />
                            </FormFieldRow>


                            <FormFieldRow
                                label={t('Contact email')}
                            >
                                <TextField
                                    fullWidth
                                    type="email"
                                    placeholder="support@domain.com"
                                    value={form.contact_email}
                                    onChange={(e) =>
                                        handleFieldChange(
                                            'contact_email',
                                            e.target.value
                                        )
                                    }
                                    sx={inputSx}
                                />
                            </FormFieldRow>

                        </Stack>
                    </Paper>


                    {/* =========================
                        Link Widget One
                    ========================= */}

                    <Paper
                        elevation={0}
                        sx={{
                            border: '1px solid #e1e5ea',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            backgroundColor: '#ffffff',
                        }}
                    >
                        <SectionHeader>
                            {t('Link Widget One')}
                        </SectionHeader>

                        <Stack
                            spacing={2.5}
                            sx={{
                                p: {
                                    xs: 2,
                                    sm: 3,
                                },
                            }}
                        >

                            <FormFieldRow
                                label={t('Widget title')}
                            >
                                <TextField
                                    fullWidth
                                    placeholder={t(
                                        'Widget title'
                                    )}
                                    value={
                                        form.widget_one_title
                                    }
                                    onChange={(e) =>
                                        handleFieldChange(
                                            'widget_one_title',
                                            e.target.value
                                        )
                                    }
                                    sx={inputSx}
                                />
                            </FormFieldRow>


                            <Box>
                                <Typography
                                    sx={{
                                        fontSize: '16px',
                                        fontWeight: 400,
                                        color: '#202431',
                                        mb: 1.5,
                                    }}
                                >
                                    {t('Links')}
                                </Typography>

                                <Stack spacing={1.5}>

                                    {form.widget_one_labels.map(
                                        (label, index) => (
                                            <Box
                                                key={index}
                                                sx={{
                                                    display: 'grid',
                                                    gridTemplateColumns:
                                                    {
                                                        xs: '1fr',
                                                        sm: '1fr 1.5fr auto',
                                                    },
                                                    gap: 1,
                                                    alignItems:
                                                        'center',
                                                }}
                                            >

                                                <TextField
                                                    fullWidth
                                                    placeholder={t(
                                                        'Label'
                                                    )}
                                                    value={label}
                                                    onChange={(
                                                        e
                                                    ) => {
                                                        const arr =
                                                            [
                                                                ...form.widget_one_labels,
                                                            ];

                                                        arr[index] =
                                                            e
                                                                .target
                                                                .value;

                                                        handleFieldChange(
                                                            'widget_one_labels',
                                                            arr
                                                        );
                                                    }}
                                                    sx={inputSx}
                                                />


                                                <TextField
                                                    fullWidth
                                                    placeholder="https://"
                                                    value={
                                                        form
                                                            .widget_one_links[
                                                        index
                                                        ] || ''
                                                    }
                                                    onChange={(
                                                        e
                                                    ) => {
                                                        const arr =
                                                            [
                                                                ...form.widget_one_links,
                                                            ];

                                                        arr[index] =
                                                            e
                                                                .target
                                                                .value;

                                                        handleFieldChange(
                                                            'widget_one_links',
                                                            arr
                                                        );
                                                    }}
                                                    sx={inputSx}
                                                />


                                                <IconButton
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemoveWidgetOne(
                                                            index
                                                        )
                                                    }
                                                    sx={{
                                                        width: {
                                                            xs: '100%',
                                                            sm: '44px',
                                                        },
                                                        height: '44px',
                                                        border:
                                                            '1px solid #fecaca',
                                                        borderRadius:
                                                            '6px',
                                                        color:
                                                            '#ef4444',
                                                    }}
                                                >
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>

                                            </Box>
                                        )
                                    )}

                                </Stack>


                                <Button
                                    type="button"
                                    startIcon={
                                        <AddIcon />
                                    }
                                    onClick={
                                        handleAddWidgetOne
                                    }
                                    sx={{
                                        mt: 2,
                                        minHeight: '40px',
                                        px: 2,
                                        border:
                                            '1px solid #d9dde5',
                                        borderRadius: '6px',
                                        color: '#4b5563',
                                        textTransform:
                                            'none',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                    }}
                                >
                                    {t('Add New')}
                                </Button>

                            </Box>

                        </Stack>
                    </Paper>


                    {/* =========================
                        Link Widget Two
                    ========================= */}

                    <Paper
                        elevation={0}
                        sx={{
                            border: '1px solid #e1e5ea',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            backgroundColor: '#ffffff',
                        }}
                    >
                        <SectionHeader>
                            {t('Link Widget Two')}
                        </SectionHeader>

                        <Stack
                            spacing={2.5}
                            sx={{
                                p: {
                                    xs: 2,
                                    sm: 3,
                                },
                            }}
                        >

                            <FormFieldRow
                                label={t('Widget title')}
                            >
                                <TextField
                                    fullWidth
                                    placeholder={t(
                                        'Widget title'
                                    )}
                                    value={
                                        form.widget_two_title
                                    }
                                    onChange={(e) =>
                                        handleFieldChange(
                                            'widget_two_title',
                                            e.target.value
                                        )
                                    }
                                    sx={inputSx}
                                />
                            </FormFieldRow>


                            <Box>
                                <Typography
                                    sx={{
                                        fontSize: '16px',
                                        fontWeight: 400,
                                        color: '#202431',
                                        mb: 1.5,
                                    }}
                                >
                                    {t('Links')}
                                </Typography>

                                <Stack spacing={1.5}>

                                    {form.widget_two_labels.map(
                                        (label, index) => (
                                            <Box
                                                key={index}
                                                sx={{
                                                    display: 'grid',
                                                    gridTemplateColumns:
                                                    {
                                                        xs: '1fr',
                                                        sm: '1fr 1.5fr auto',
                                                    },
                                                    gap: 1,
                                                    alignItems:
                                                        'center',
                                                }}
                                            >

                                                <TextField
                                                    fullWidth
                                                    placeholder={t(
                                                        'Label'
                                                    )}
                                                    value={label}
                                                    onChange={(
                                                        e
                                                    ) => {
                                                        const arr =
                                                            [
                                                                ...form.widget_two_labels,
                                                            ];

                                                        arr[index] =
                                                            e
                                                                .target
                                                                .value;

                                                        handleFieldChange(
                                                            'widget_two_labels',
                                                            arr
                                                        );
                                                    }}
                                                    sx={inputSx}
                                                />


                                                <TextField
                                                    fullWidth
                                                    placeholder="https://"
                                                    value={
                                                        form
                                                            .widget_two_links[
                                                        index
                                                        ] || ''
                                                    }
                                                    onChange={(
                                                        e
                                                    ) => {
                                                        const arr =
                                                            [
                                                                ...form.widget_two_links,
                                                            ];

                                                        arr[index] =
                                                            e
                                                                .target
                                                                .value;

                                                        handleFieldChange(
                                                            'widget_two_links',
                                                            arr
                                                        );
                                                    }}
                                                    sx={inputSx}
                                                />


                                                <IconButton
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemoveWidgetTwo(
                                                            index
                                                        )
                                                    }
                                                    sx={{
                                                        width: {
                                                            xs: '100%',
                                                            sm: '44px',
                                                        },
                                                        height: '44px',
                                                        border:
                                                            '1px solid #fecaca',
                                                        borderRadius:
                                                            '6px',
                                                        color:
                                                            '#ef4444',
                                                    }}
                                                >
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>

                                            </Box>
                                        )
                                    )}

                                </Stack>


                                <Button
                                    type="button"
                                    startIcon={
                                        <AddIcon />
                                    }
                                    onClick={
                                        handleAddWidgetTwo
                                    }
                                    sx={{
                                        mt: 2,
                                        minHeight: '40px',
                                        px: 2,
                                        border:
                                            '1px solid #d9dde5',
                                        borderRadius: '6px',
                                        color: '#4b5563',
                                        textTransform:
                                            'none',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                    }}
                                >
                                    {t('Add New')}
                                </Button>

                            </Box>

                        </Stack>
                    </Paper>


                    {/* =========================
                        Footer Bottom
                    ========================= */}

                    <Paper
                        elevation={0}
                        sx={{
                            border: '1px solid #e1e5ea',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            backgroundColor: '#ffffff',
                        }}
                    >
                        <SectionHeader>
                            {t('Footer Bottom')}
                        </SectionHeader>

                        <Stack
                            spacing={3}
                            sx={{
                                p: {
                                    xs: 2,
                                    sm: 3,
                                },
                            }}
                        >

                            {/* Copyright */}

                            <Box>
                                <Typography
                                    sx={{
                                        fontSize: '16px',
                                        fontWeight: 400,
                                        color: '#202431',
                                        mb: 1.5,
                                    }}
                                >
                                    {t(
                                        'Copyright Widget (Translatable)'
                                    )}
                                </Typography>

                                <AizTextEditor
                                    value={
                                        form.frontend_copyright_text
                                    }
                                    onChange={(val) =>
                                        handleFieldChange(
                                            'frontend_copyright_text',
                                            val
                                        )
                                    }
                                    placeholder={t(
                                        'Copyright © 2026 ...'
                                    )}
                                />
                            </Box>


                            {/* Social Links */}

                            <Box
                                sx={{
                                    borderTop:
                                        '1px solid #e1e5ea',
                                    pt: 3,
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent:
                                            'space-between',
                                        alignItems: {
                                            xs: 'flex-start',
                                            sm: 'center',
                                        },
                                        flexDirection: {
                                            xs: 'column',
                                            sm: 'row',
                                        },
                                        gap: 2,
                                        mb: 2,
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: '16px',
                                            fontWeight: 400,
                                            color: '#202431',
                                        }}
                                    >
                                        {t(
                                            'Social Link Widget'
                                        )}
                                    </Typography>

                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={
                                                    form.show_social_links ===
                                                    'on' ||
                                                    form.show_social_links ===
                                                    true
                                                }
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        'show_social_links',
                                                        e.target
                                                            .checked
                                                            ? 'on'
                                                            : 'off'
                                                    )
                                                }
                                            />
                                        }
                                        label={t(
                                            'Show Social Links?'
                                        )}
                                    />
                                </Box>


                                <Stack spacing={1.5}>

                                    <TextField
                                        fullWidth
                                        placeholder="https://facebook.com/..."
                                        value={
                                            form.facebook_link
                                        }
                                        onChange={(e) =>
                                            handleFieldChange(
                                                'facebook_link',
                                                e.target.value
                                            )
                                        }
                                        InputProps={{
                                            startAdornment: (
                                                <FacebookIcon
                                                    fontSize="small"
                                                    sx={{
                                                        mr: 1,
                                                    }}
                                                />
                                            ),
                                        }}
                                        sx={inputSx}
                                    />


                                    <TextField
                                        fullWidth
                                        placeholder="https://twitter.com/..."
                                        value={
                                            form.twitter_link
                                        }
                                        onChange={(e) =>
                                            handleFieldChange(
                                                'twitter_link',
                                                e.target.value
                                            )
                                        }
                                        InputProps={{
                                            startAdornment: (
                                                <TwitterIcon
                                                    fontSize="small"
                                                    sx={{
                                                        mr: 1,
                                                    }}
                                                />
                                            ),
                                        }}
                                        sx={inputSx}
                                    />


                                    <TextField
                                        fullWidth
                                        placeholder="https://instagram.com/..."
                                        value={
                                            form.instagram_link
                                        }
                                        onChange={(e) =>
                                            handleFieldChange(
                                                'instagram_link',
                                                e.target.value
                                            )
                                        }
                                        InputProps={{
                                            startAdornment: (
                                                <InstagramIcon
                                                    fontSize="small"
                                                    sx={{
                                                        mr: 1,
                                                    }}
                                                />
                                            ),
                                        }}
                                        sx={inputSx}
                                    />


                                    <TextField
                                        fullWidth
                                        placeholder="https://youtube.com/..."
                                        value={
                                            form.youtube_link
                                        }
                                        onChange={(e) =>
                                            handleFieldChange(
                                                'youtube_link',
                                                e.target.value
                                            )
                                        }
                                        InputProps={{
                                            startAdornment: (
                                                <YoutubeIcon
                                                    fontSize="small"
                                                    sx={{
                                                        mr: 1,
                                                    }}
                                                />
                                            ),
                                        }}
                                        sx={inputSx}
                                    />


                                    <TextField
                                        fullWidth
                                        placeholder="https://linkedin.com/..."
                                        value={
                                            form.linkedin_link
                                        }
                                        onChange={(e) =>
                                            handleFieldChange(
                                                'linkedin_link',
                                                e.target.value
                                            )
                                        }
                                        InputProps={{
                                            startAdornment: (
                                                <LinkedinIcon
                                                    fontSize="small"
                                                    sx={{
                                                        mr: 1,
                                                    }}
                                                />
                                            ),
                                        }}
                                        sx={inputSx}
                                    />

                                </Stack>
                            </Box>


                            {/* Save */}

                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent:
                                        'flex-end',
                                    pt: 1,
                                    borderTop:
                                        '1px solid #e1e5ea',
                                }}
                            >
                                <Button
                                    type="submit"
                                    variant="outlined"
                                    disabled={saving}
                                    startIcon={
                                        saving ? (
                                            <CircularProgress
                                                size={18}
                                            />
                                        ) : (
                                            <SaveIcon />
                                        )
                                    }
                                    sx={{
                                        minWidth: '120px',
                                        height: '42px',
                                        borderColor:
                                            '#f59e0b',
                                        color: '#d97706',
                                        borderRadius: '6px',
                                        textTransform:
                                            'none',
                                        fontSize: '15px',
                                        fontWeight: 500,

                                        '&:hover': {
                                            borderColor:
                                                '#d97706',
                                            backgroundColor:
                                                '#fff7ed',
                                        },
                                    }}
                                >
                                    {saving
                                        ? t('Updating...')
                                        : t('Update')}
                                </Button>
                            </Box>

                        </Stack>
                    </Paper>

                </Stack>

            </form>
        </Box>
    );
};


export default FooterSettings;
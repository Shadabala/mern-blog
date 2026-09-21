import React, { useState, useEffect } from 'react';

import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Stack,
    FormControl,
    RadioGroup,
    FormControlLabel,
    Radio,
    IconButton,
    Alert,
    CircularProgress,
    Switch,
} from '@mui/material';

import {
    Save as SaveIcon,
    Add as AddIcon,
    Close as CloseIcon,
} from '@mui/icons-material';

import AizUploaderInput from '../../components/uploader/AizUploaderInput';

import {
    fetchHeaderSettingsApi,
    updateHeaderSettingsApi,
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
};


/**
 * =========================================================
 * FORM FIELD ROW
 * =========================================================
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


/**
 * =========================================================
 * SECTION HEADER
 * =========================================================
 */
const SectionHeader = ({
    children,
}) => {
    return (
        <Box
            sx={{
                pt: 1,
                pb: 1.5,
            }}
        >
            <Typography
                sx={{
                    fontSize: '17px',
                    fontWeight: 600,
                    color: '#202431',
                }}
            >
                {children}
            </Typography>
        </Box>
    );
};


/**
 * =========================================================
 * HEADER SETTINGS
 * =========================================================
 */
const HeaderSettings = () => {
    const {
        t,
        currentLang,
        languages,
    } = useLanguage();


    /**
     * =========================================================
     * STATES
     * =========================================================
     */

    const [
        selectedLang,
        setSelectedLang,
    ] = useState(
        currentLang || 'en'
    );

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
     * FORM
     * =========================================================
     */

    const initialFormState = {
        types: [
            'header_logo',
            'topbar_banner',
            'topbar_banner_link',
            'helpline_number',
            'helpine_email',
            'helpine_whatsapp',
            'show_language_switcher',
            'enable_sticky_header',
            'header_nav_menu_text',
            'header_menu_labels',
            'header_menu_links',
        ],
        header_logo: '',
        topbar_banner: '',
        topbar_banner_link: '',
        helpline_number: '',
        helpine_email: '',
        helpine_whatsapp: '',
        show_language_switcher: 'off',
        enable_sticky_header: 'off',
        header_nav_menu_text: 'light',
        header_menu_labels: [],
        header_menu_links: [],
    };


    const [
        form,
        setForm,
    ] = useState(
        initialFormState
    );

    /**
     * =========================================================
     * LOAD SETTINGS
     * =========================================================
     */

    useEffect(() => {
        let mounted = true;

        const loadSettings =
            async () => {
                try {
                    setLoading(true);

                    const res =
                        await fetchHeaderSettingsApi(
                            selectedLang
                        );

                    if (
                        mounted &&
                        res?.success &&
                        res.settings
                    ) {
                        setForm({
                            types: initialFormState.types,
                            header_logo:
                                res.settings.header_logo || '',

                            topbar_banner:
                                res.settings.topbar_banner || '',

                            topbar_banner_link:
                                res.settings.topbar_banner_link || '',

                            helpline_number:
                                res.settings.helpline_number || '',

                            helpine_email:
                                res.settings.helpine_email || res.settings.helpline_email || '',

                            helpine_whatsapp:
                                res.settings.helpine_whatsapp || res.settings.helpline_whatsapp || '',

                            show_language_switcher:
                                (res.settings.show_language_switcher === 'on' || res.settings.show_language_switcher === '1' || res.settings.show_language_switcher === true) ? 'on' : 'off',

                            enable_sticky_header:
                                (res.settings.enable_sticky_header === 'on' || res.settings.enable_sticky_header === '1' || res.settings.enable_sticky_header === true) ? 'on' : 'off',

                            header_nav_menu_text:
                                res.settings.header_nav_menu_text || 'light',

                            header_menu_labels:
                                Array.isArray(
                                    res.settings.header_menu_labels
                                )
                                    ? res.settings.header_menu_labels
                                    : [],

                            header_menu_links:
                                Array.isArray(
                                    res.settings.header_menu_links
                                )
                                    ? res.settings.header_menu_links
                                    : [],
                        });
                    }
                } catch (
                err
                ) {
                    console.error(
                        'Failed to load header settings:',
                        err
                    );

                    if (mounted) {
                        setAlertMessage({
                            type: 'error',
                            text: t(
                                'Failed to load header settings',
                                'Failed to load header settings'
                            ),
                        });
                    }
                } finally {
                    if (mounted) {
                        setLoading(false);
                    }
                }
            };

        loadSettings();

        return () => {
            mounted = false;
        };
    }, [
        selectedLang,
        t,
    ]);


    /**
     * =========================================================
     * FIELD CHANGE
     * =========================================================
     */

    const handleFieldChange = (
        field,
        value
    ) => {
        setForm(
            (prev) => ({
                ...prev,
                [field]: value,
            })
        );
    };


    /**
     * =========================================================
     * ADD MENU ITEM
     * =========================================================
     */

    const handleAddMenuItem =
        () => {
            setForm(
                (prev) => ({
                    ...prev,

                    header_menu_labels: [
                        ...prev.header_menu_labels,
                        '',
                    ],

                    header_menu_links: [
                        ...prev.header_menu_links,
                        '',
                    ],
                })
            );
        };


    /**
     * =========================================================
     * REMOVE MENU ITEM
     * =========================================================
     */

    const handleRemoveMenuItem =
        (index) => {
            setForm(
                (prev) => ({
                    ...prev,

                    header_menu_labels:
                        prev.header_menu_labels.filter(
                            (_, idx) =>
                                idx !== index
                        ),

                    header_menu_links:
                        prev.header_menu_links.filter(
                            (_, idx) =>
                                idx !== index
                        ),
                })
            );
        };


    /**
     * =========================================================
     * MENU LABEL CHANGE
     * =========================================================
     */

    const handleMenuLabelChange =
        (
            index,
            value
        ) => {
            setForm(
                (prev) => {
                    const updated =
                        [
                            ...prev.header_menu_labels,
                        ];

                    updated[index] =
                        value;

                    return {
                        ...prev,

                        header_menu_labels:
                            updated,
                    };
                }
            );
        };


    /**
     * =========================================================
     * MENU LINK CHANGE
     * =========================================================
     */

    const handleMenuLinkChange =
        (
            index,
            value
        ) => {
            setForm(
                (prev) => {
                    const updated =
                        [
                            ...prev.header_menu_links,
                        ];

                    updated[index] =
                        value;

                    return {
                        ...prev,

                        header_menu_links:
                            updated,
                    };
                }
            );
        };


    /**
     * =========================================================
     * SUBMIT
     * =========================================================
     */

    const handleSubmit =
        async (e) => {
            e.preventDefault();

            setSaving(true);

            setAlertMessage({
                type: 'info',
                text: '',
            });

            try {
                await updateHeaderSettingsApi({
                    ...form,

                    lang:
                        selectedLang,
                });

                const successMsg = t(
                    'Header settings updated successfully',
                    'Header settings updated successfully'
                );
                setAlertMessage({
                    type: 'success',

                    text: successMsg,
                });
                toast.success(successMsg);
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('website_settings_updated'));
                }
            } catch (
            err
            ) {
                console.error(
                    'Failed to update header settings:',
                    err
                );

                const errorMsg = err?.response?.data?.message || t(
                    'Failed to update header settings',
                    'Failed to update header settings'
                );
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
     * LOADING
     * =========================================================
     */

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight:
                        '300px',

                    display:
                        'flex',

                    justifyContent:
                        'center',

                    alignItems:
                        'center',

                    backgroundColor:
                        '#f7f8fa',
                }}
            >
                <CircularProgress
                    size={30}
                />
            </Box>
        );
    }


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
                                'Header Setting',
                                'Header Setting'
                            )}
                        </Typography>
                    </Box>

                    {/* =================================================
                        FORM
                    ================================================== */}

                    <Box
                        component="form"
                        onSubmit={
                            handleSubmit
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
                                xs: 3,
                                sm: 3.5,
                            }}
                        >

                            {/* HEADER LOGO */}

                            <FormFieldRow
                                label={t(
                                    'Header Logo',
                                    'Header Logo'
                                )}
                                alignItems="start"
                            >
                                <AizUploaderInput
                                    value={
                                        form.header_logo
                                    }
                                    onChange={(
                                        url
                                    ) =>
                                        handleFieldChange(
                                            'header_logo',
                                            url
                                        )
                                    }
                                    type="image"
                                    placeholder={t(
                                        'Choose file',
                                        'Choose file'
                                    )}
                                    helperText=""
                                />
                            </FormFieldRow>

                            {/* TOPBAR BANNER */}

                            <FormFieldRow
                                label={t(
                                    'Topbar Banner',
                                    'Topbar Banner'
                                )}
                                alignItems="start"
                            >
                                <AizUploaderInput
                                    value={
                                        form.topbar_banner
                                    }
                                    onChange={(
                                        url
                                    ) =>
                                        handleFieldChange(
                                            'topbar_banner',
                                            url
                                        )
                                    }
                                    type="image"
                                    placeholder={t(
                                        'Choose file',
                                        'Choose file'
                                    )}
                                    helperText=""
                                />
                            </FormFieldRow>

                            {/* TOPBAR BANNER LINK */}

                            <FormFieldRow
                                label={t(
                                    'Topbar banner link',
                                    'Topbar banner link'
                                )}
                            >
                                <TextField
                                    fullWidth
                                    placeholder="Link with http:// or https://"
                                    value={
                                        form.topbar_banner_link ||
                                        ''
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        handleFieldChange(
                                            'topbar_banner_link',
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

                            {/* HELPLINE NUMBER */}

                            <FormFieldRow
                                label={t(
                                    'Helpline number',
                                    'Helpline number'
                                )}
                            >
                                <TextField
                                    fullWidth
                                    placeholder={t(
                                        'Helpline number',
                                        'Helpline number'
                                    )}
                                    value={
                                        form.helpline_number ||
                                        ''
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        handleFieldChange(
                                            'helpline_number',
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

                            {/* E-MAIL */}

                            <FormFieldRow
                                label={t(
                                    'E-Mail',
                                    'E-Mail'
                                )}
                            >
                                <TextField
                                    fullWidth
                                    placeholder={t(
                                        'E-Mail',
                                        'E-Mail'
                                    )}
                                    value={
                                        form.helpine_email ||
                                        ''
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        handleFieldChange(
                                            'helpine_email',
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

                            {/* WHATSAPP */}

                            <FormFieldRow
                                label={t(
                                    'WhatsApp',
                                    'WhatsApp'
                                )}
                            >
                                <TextField
                                    fullWidth
                                    placeholder={t(
                                        'WhatsApp',
                                        'WhatsApp'
                                    )}
                                    value={
                                        form.helpine_whatsapp ||
                                        ''
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        handleFieldChange(
                                            'helpine_whatsapp',
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

                            {/* SHOW LANGUAGE SWITCHER */}

                            <FormFieldRow
                                label={t(
                                    'Show language switcher ?',
                                    'Show language switcher ?'
                                )}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', minHeight: '64px' }}>
                                    <Switch
                                        checked={Boolean(
                                            form.show_language_switcher === 'on' ||
                                            form.show_language_switcher === true ||
                                            form.show_language_switcher === '1' ||
                                            form.show_language_switcher === 1
                                        )}
                                        onChange={(e) =>
                                            handleFieldChange(
                                                'show_language_switcher',
                                                e.target.checked ? 'on' : 'off'
                                            )
                                        }
                                        color="primary"
                                    />
                                </Box>
                            </FormFieldRow>

                            {/* ENABLE STICKY HEADER */}

                            <FormFieldRow
                                label={t(
                                    'Enable sticky header ?',
                                    'Enable sticky header ?'
                                )}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', minHeight: '64px' }}>
                                    <Switch
                                        checked={Boolean(
                                            form.enable_sticky_header === 'on' ||
                                            form.enable_sticky_header === true ||
                                            form.enable_sticky_header === '1' ||
                                            form.enable_sticky_header === 1
                                        )}
                                        onChange={(e) =>
                                            handleFieldChange(
                                                'enable_sticky_header',
                                                e.target.checked ? 'on' : 'off'
                                            )
                                        }
                                        color="primary"
                                    />
                                </Box>
                            </FormFieldRow>


                            {/* =================================================
                                NAVIGATION
                            ================================================== */}

                            <SectionHeader>
                                {t(
                                    'Navigation',
                                    'Navigation'
                                )}
                            </SectionHeader>


                            {/* MENU TEXT */}

                            <FormFieldRow
                                label={t(
                                    'Header Nav Menu Text Color',
                                    'Header Nav Menu Text Color'
                                )}
                                alignItems="start"
                            >
                                <RadioGroup
                                    row
                                    name="header_nav_menu_text"
                                    value={
                                        form.header_nav_menu_text ||
                                        'light'
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        handleFieldChange(
                                            'header_nav_menu_text',
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                    sx={{
                                        minHeight:
                                            '64px',

                                        alignItems:
                                            'center',
                                    }}
                                >
                                    <FormControlLabel
                                        value="light"
                                        control={
                                            <Radio />
                                        }
                                        label={t(
                                            'Light',
                                            'Light'
                                        )}
                                    />

                                    <FormControlLabel
                                        value="dark"
                                        control={
                                            <Radio />
                                        }
                                        label={t(
                                            'Dark',
                                            'Dark'
                                        )}
                                    />
                                </RadioGroup>
                            </FormFieldRow>


                            {/* =================================================
                                HEADER MENU
                            ================================================== */}

                            <Box
                                sx={{
                                    pt: 1,
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize:
                                            '16px',

                                        fontWeight:
                                            500,

                                        color:
                                            '#202431',

                                        mb: 2,
                                    }}
                                >
                                    {t(
                                        'Header Nav Menu',
                                        'Header Nav Menu'
                                    )}
                                </Typography>


                                <Stack
                                    spacing={
                                        1.5
                                    }
                                >
                                    {form
                                        .header_menu_labels
                                        .map(
                                            (
                                                label,
                                                index
                                            ) => (
                                                <Paper
                                                    key={
                                                        index
                                                    }
                                                    elevation={
                                                        0
                                                    }
                                                    sx={{
                                                        border:
                                                            '1px solid #d9dde5',

                                                        borderRadius:
                                                            '6px',

                                                        p: {
                                                            xs: 1.5,
                                                            sm: 2,
                                                        },

                                                        backgroundColor:
                                                            '#fafbfc',
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            display:
                                                                'grid',

                                                            gridTemplateColumns:
                                                            {
                                                                xs: '1fr',
                                                                sm: '1fr 1fr 48px',
                                                            },

                                                            gap: 1.5,

                                                            alignItems:
                                                                'center',
                                                        }}
                                                    >

                                                        {/* LABEL */}

                                                        <TextField
                                                            fullWidth
                                                            placeholder={t(
                                                                'Label',
                                                                'Label'
                                                            )}
                                                            value={
                                                                label ||
                                                                ''
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                handleMenuLabelChange(
                                                                    index,
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
                                                                        '56px',
                                                                },

                                                                '& .MuiInputBase-input':
                                                                {
                                                                    fontSize:
                                                                        '16px',
                                                                },
                                                            }}
                                                        />


                                                        {/* LINK */}

                                                        <TextField
                                                            fullWidth
                                                            placeholder={t(
                                                                'Link with http:// or https://',
                                                                'Link with http:// or https://'
                                                            )}
                                                            value={
                                                                form
                                                                    .header_menu_links[
                                                                index
                                                                ] ||
                                                                ''
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                handleMenuLinkChange(
                                                                    index,
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
                                                                        '56px',
                                                                },

                                                                '& .MuiInputBase-input':
                                                                {
                                                                    fontSize:
                                                                        '16px',
                                                                },
                                                            }}
                                                        />


                                                        {/* REMOVE */}

                                                        <Box
                                                            sx={{
                                                                display:
                                                                    'flex',

                                                                justifyContent:
                                                                {
                                                                    xs: 'flex-end',
                                                                    sm: 'center',
                                                                },
                                                            }}
                                                        >
                                                            <IconButton
                                                                type="button"
                                                                onClick={() =>
                                                                    handleRemoveMenuItem(
                                                                        index
                                                                    )
                                                                }
                                                                sx={{
                                                                    width:
                                                                        '42px',

                                                                    height:
                                                                        '42px',

                                                                    color:
                                                                        '#ef4444',

                                                                    border:
                                                                        '1px solid #fecaca',

                                                                    backgroundColor:
                                                                        '#fff5f5',

                                                                    borderRadius:
                                                                        '5px',

                                                                    '&:hover':
                                                                    {
                                                                        backgroundColor:
                                                                            '#fee2e2',

                                                                        borderColor:
                                                                            '#fca5a5',
                                                                    },
                                                                }}
                                                            >
                                                                <CloseIcon
                                                                    fontSize="small"
                                                                />
                                                            </IconButton>
                                                        </Box>
                                                    </Box>
                                                </Paper>
                                            )
                                        )}


                                    {/* =================================================
                                        EMPTY STATE
                                    ================================================== */}

                                    {form
                                        .header_menu_labels
                                        .length ===
                                        0 && (
                                            <Box
                                                sx={{
                                                    border:
                                                        '1px dashed #d9dde5',

                                                    borderRadius:
                                                        '6px',

                                                    py: 3,

                                                    px: 2,

                                                    textAlign:
                                                        'center',

                                                    backgroundColor:
                                                        '#fafbfc',
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontSize:
                                                            '14px',

                                                        color:
                                                            '#858b98',
                                                    }}
                                                >
                                                    {t(
                                                        'No menu items added yet.',
                                                        'No menu items added yet.'
                                                    )}
                                                </Typography>
                                            </Box>
                                        )}


                                    {/* =================================================
                                        ADD BUTTON
                                    ================================================== */}

                                    <Box>
                                        <Button
                                            type="button"
                                            variant="outlined"
                                            startIcon={
                                                <AddIcon />
                                            }
                                            onClick={
                                                handleAddMenuItem
                                            }
                                            sx={{
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
                                                    '#475569',

                                                borderColor:
                                                    '#cbd5e1',

                                                '&:hover':
                                                {
                                                    borderColor:
                                                        '#94a3b8',

                                                    backgroundColor:
                                                        '#f8fafc',
                                                },
                                            }}
                                        >
                                            {t(
                                                'Add New',
                                                'Add New'
                                            )}
                                        </Button>
                                    </Box>
                                </Stack>
                            </Box>


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
                                        ) : (
                                            <SaveIcon
                                                sx={{
                                                    fontSize:
                                                        '18px',
                                                }}
                                            />
                                        )
                                    }
                                    sx={{
                                        minWidth:
                                            '100px',

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
                            </Box>
                        </Stack>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};

export default HeaderSettings;
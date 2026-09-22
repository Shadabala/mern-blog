import { useMemo, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import rtlPlugin from 'stylis-plugin-rtl';

// Handle CommonJS vs ES module default export
const rawRtlPlugin = typeof rtlPlugin === 'function' ? rtlPlugin : (rtlPlugin?.default || rtlPlugin);

const safeRtlPlugin = (element) => {
    try {
        if (typeof rawRtlPlugin === 'function') {
            return rawRtlPlugin(element);
        }
    } catch (err) {
        return undefined;
    }
};

// Emotion cache for RTL without redundant prefixer (which causes stylis 'push' crash in Emotion)
const cacheRtl = createCache({
    key: 'muirtl',
    stylisPlugins: typeof rawRtlPlugin === 'function' ? [safeRtlPlugin] : [],
});

const cacheLtr = createCache({
    key: 'muiltr',
});

const RTLProvider = ({ children }) => {
    const { isRtl } = useLanguage();
    const { get_setting } = useSettings();

    const primaryColor = get_setting('primary_color', '#3bf73e');
    const primaryHoverColor = get_setting('primary_hover_color', '#94d382');
    const secondaryColor = get_setting('secondary_color', '#de3f7f');
    const secondaryHoverColor = get_setting('secondary_hover_color', '#b92d64');

    useEffect(() => {
        document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
        document.body.dir = isRtl ? 'rtl' : 'ltr';
    }, [isRtl]);

    const theme = useMemo(() => {
        return createTheme({
            direction: isRtl ? 'rtl' : 'ltr',
            palette: {
                primary: {
                    main: primaryColor,
                    dark: primaryHoverColor,
                    contrastText: '#ffffff'
                },
                secondary: {
                    main: secondaryColor,
                    dark: secondaryHoverColor,
                    contrastText: '#ffffff'
                }
            },
            typography: {
                fontFamily: isRtl
                    ? "'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif"
                    : "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif"
            },
            components: {
                MuiButton: {
                    styleOverrides: {
                        containedPrimary: {
                            backgroundColor: primaryColor,
                            '&:hover': {
                                backgroundColor: primaryHoverColor
                            }
                        },
                        containedSecondary: {
                            backgroundColor: secondaryColor,
                            '&:hover': {
                                backgroundColor: secondaryHoverColor
                            }
                        }
                    }
                }
            }
        });
    }, [isRtl, primaryColor, primaryHoverColor, secondaryColor, secondaryHoverColor]);

    return (
        <CacheProvider value={isRtl ? cacheRtl : cacheLtr}>
            <ThemeProvider theme={theme}>
                {children}
            </ThemeProvider>
        </CacheProvider>
    );
};

export default RTLProvider;


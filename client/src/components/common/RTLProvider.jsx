import { useMemo, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
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

    useEffect(() => {
        document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
        document.body.dir = isRtl ? 'rtl' : 'ltr';
    }, [isRtl]);

    const theme = useMemo(() => {
        return createTheme({
            direction: isRtl ? 'rtl' : 'ltr',
            typography: {
                fontFamily: isRtl
                    ? "'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif"
                    : "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif"
            }
        });
    }, [isRtl]);

    return (
        <CacheProvider value={isRtl ? cacheRtl : cacheLtr}>
            <ThemeProvider theme={theme}>
                {children}
            </ThemeProvider>
        </CacheProvider>
    );
};

export default RTLProvider;


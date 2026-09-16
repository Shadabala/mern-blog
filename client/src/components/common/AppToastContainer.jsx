import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Global AppToastContainer
 * Configures react-toastify with RTL awareness, theme, positioning, and high z-index.
 */
const AppToastContainer = () => {
    const { isRtl } = useLanguage();

    return (
        <ToastContainer
            position={isRtl ? "top-left" : "top-right"}
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={Boolean(isRtl)}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
            style={{
                zIndex: 999999, // Ensure toasts show above modals, uppy, dialogs, drawers
                fontSize: '14px',
                fontWeight: 500,
            }}
        />
    );
};

export default AppToastContainer;

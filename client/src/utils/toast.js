import { toast } from 'react-toastify';

/**
 * Universal toast notification utility wrapper around react-toastify.
 * Provides unified, styled notifications across both Admin and Public application areas.
 */
export const showToast = {
    success: (message, options = {}) => {
        if (!message) return;
        return toast.success(message, {
            autoClose: 3000,
            ...options,
        });
    },

    error: (message, options = {}) => {
        if (!message) return;
        return toast.error(message, {
            autoClose: 4000,
            ...options,
        });
    },

    info: (message, options = {}) => {
        if (!message) return;
        return toast.info(message, {
            autoClose: 3000,
            ...options,
        });
    },

    warning: (message, options = {}) => {
        if (!message) return;
        return toast.warning(message, {
            autoClose: 3500,
            ...options,
        });
    },

    dismiss: (toastId) => {
        toast.dismiss(toastId);
    },

    clear: () => {
        toast.dismiss();
    }
};

// Re-export toast directly for standard react-toastify usage
export { toast };
export default showToast;

import Swal from 'sweetalert2';

/**
 * Custom SweetAlert2 setup with modern UI aesthetics matching MERN Blog design:
 * - Rounded dialog (20px)
 * - Cohesive buttons (Indigo primary, Amber warning, Red danger, Slate cancel)
 * - Automatic RTL detection
 * - Top-tier animations & backdrop
 */

// Helper to check RTL direction
const isRtl = () => {
    try {
        return (
            document.documentElement.dir === 'rtl' ||
            document.body.dir === 'rtl' ||
            localStorage.getItem('i18nextLng') === 'ar' ||
            localStorage.getItem('app_language') === 'ar'
        );
    } catch {
        return false;
    }
};

// Base configured Swal instance with customized styling classes
export const AppSwal = Swal.mixin({
    customClass: {
        popup: 'app-swal-popup',
        title: 'app-swal-title',
        htmlContainer: 'app-swal-html',
        confirmButton: 'app-swal-confirm-btn',
        cancelButton: 'app-swal-cancel-btn',
        denyButton: 'app-swal-deny-btn'
    },
    buttonsStyling: true,
    focusCancel: true,
    scrollbarPadding: false
});

/**
 * Confirm deletion dialog with warning icon and danger button
 * @param {Object} options
 * @param {string} [options.title] - Dialog title
 * @param {string} [options.text] - Dialog description
 * @param {string} [options.itemName] - Name of the entity being deleted
 * @param {string} [options.confirmButtonText] - Custom confirm text
 * @param {string} [options.cancelButtonText] - Custom cancel text
 * @returns {Promise<boolean>} Resolves to true if user confirmed, false otherwise
 */
export const confirmDelete = async ({
    title,
    text,
    itemName,
    confirmButtonText = 'Yes, delete it!',
    cancelButtonText = 'Cancel'
} = {}) => {
    const rtl = isRtl();
    const resolvedTitle = title || (itemName ? `Delete "${itemName}"?` : 'Are you sure?');
    const resolvedText = text || "You won't be able to revert this action!";

    const result = await AppSwal.fire({
        title: resolvedTitle,
        text: resolvedText,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444', // Red-500
        cancelButtonColor: '#94a3b8',  // Slate-400
        confirmButtonText,
        cancelButtonText,
        reverseButtons: rtl,
        iconColor: '#f59e0b'
    });

    return result.isConfirmed;
};

/**
 * Generic action confirmation dialog (e.g. impersonate user, clear cache, logout)
 * @param {Object} options
 * @returns {Promise<boolean>} Resolves to true if user confirmed, false otherwise
 */
export const confirmAction = async ({
    title = 'Confirm Action',
    text = 'Are you sure you want to proceed?',
    confirmButtonText = 'Yes, proceed',
    cancelButtonText = 'Cancel',
    icon = 'question',
    confirmButtonColor = '#4f46e5'
} = {}) => {
    const rtl = isRtl();
    const result = await AppSwal.fire({
        title,
        text,
        icon,
        showCancelButton: true,
        confirmButtonColor,
        cancelButtonColor: '#94a3b8',
        confirmButtonText,
        cancelButtonText,
        reverseButtons: rtl
    });

    return result.isConfirmed;
};

/**
 * Success modal alert
 */
export const alertSuccess = (title = 'Success!', text = '', options = {}) => {
    return AppSwal.fire({
        title,
        text,
        icon: 'success',
        confirmButtonColor: '#4f46e5',
        confirmButtonText: 'OK',
        timer: options.timer !== undefined ? options.timer : 2500,
        timerProgressBar: options.timerProgressBar !== undefined ? options.timerProgressBar : true,
        ...options
    });
};

/**
 * Error modal alert
 */
export const alertError = (title = 'Error', text = 'Something went wrong.', options = {}) => {
    return AppSwal.fire({
        title,
        text,
        icon: 'error',
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Dismiss',
        ...options
    });
};

/**
 * Warning modal alert
 */
export const alertWarning = (title = 'Warning', text = '', options = {}) => {
    return AppSwal.fire({
        title,
        text,
        icon: 'warning',
        confirmButtonColor: '#f59e0b',
        confirmButtonText: 'OK',
        ...options
    });
};

/**
 * Info modal alert
 */
export const alertInfo = (title = 'Information', text = '', options = {}) => {
    return AppSwal.fire({
        title,
        text,
        icon: 'info',
        confirmButtonColor: '#0ea5e9',
        confirmButtonText: 'OK',
        ...options
    });
};

/**
 * Input prompt modal (e.g. rename, reason, custom input)
 */
export const promptInput = async ({
    title = 'Input Required',
    input = 'text',
    inputLabel = '',
    inputPlaceholder = '',
    inputValue = '',
    confirmButtonText = 'Submit',
    cancelButtonText = 'Cancel',
    inputValidator = null
} = {}) => {
    const rtl = isRtl();
    const result = await AppSwal.fire({
        title,
        input,
        inputLabel,
        inputPlaceholder,
        inputValue,
        showCancelButton: true,
        confirmButtonColor: '#4f46e5',
        cancelButtonColor: '#94a3b8',
        confirmButtonText,
        cancelButtonText,
        reverseButtons: rtl,
        inputValidator
    });

    return result.isConfirmed ? result.value : null;
};

export { Swal };
export default AppSwal;

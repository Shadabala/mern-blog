import React, { useState } from 'react';
import { Box, Typography, IconButton, Paper, styled } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import AizUploaderModal from './AizUploaderModal';
import { useLanguage } from '../../context/LanguageContext';

const BACKEND_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

const resolvePreviewUrl = (raw) => {
    if (!raw) return '';
    const str = String(raw).trim();
    if (str.includes('.amazonaws.com/')) {
        const after = str.split('.amazonaws.com/')[1];
        if (after) {
            return `${BACKEND_BASE}/${after.replace(/^\/?(public\/)?/, '')}`;
        }
    }
    if (str.includes('.backblazeb2.com/')) {
        const after = str.split('.backblazeb2.com/')[1];
        if (after) {
            return `${BACKEND_BASE}/${after.replace(/^\/?(public\/)?/, '')}`;
        }
    }
    if (str.startsWith('http://') || str.startsWith('https://')) return str;
    const clean = str.replace(/\\/g, '/').replace(/^\/?(public\/)?/, '');
    return `${BACKEND_BASE}/${clean}`;
};

const UploadTriggerBar = styled(Paper)(({ theme }) => ({
    display: 'flex',
    alignItems: 'stretch',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    minHeight: '40px',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    '&:hover': {
        borderColor: '#9ca3af'
    }
}));

const BrowseButton = styled(Box)(({ theme }) => ({
    backgroundColor: '#f3f4f6',
    color: '#374151',
    padding: '8px 16px',
    fontWeight: 500,
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRight: '1px solid #d1d5db',
    userSelect: 'none'
}));

const FileNameText = styled(Box)`
    flex-grow: 1;
    padding: 8px 14px;
    display: flex;
    align-items: center;
    font-size: 0.875rem;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
`;

const AizUploaderInput = ({
    label,
    value,
    onChange,
    multiple = false,
    type = 'image',
    placeholder = 'Choose File',
    helperText
}) => {
    const { t } = useLanguage();
    const [modalOpen, setModalOpen] = useState(false);

    // Normalize value to array of urls/objects
    const getNormalizedList = () => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
            return value.split(',').map(s => s.trim()).filter(Boolean);
        }
        return [value];
    };

    const selectedList = getNormalizedList();

    const handleSelectFiles = (selected) => {
        if (multiple) {
            const list = Array.isArray(selected) ? selected : [selected];
            const urls = list.map(item => (typeof item === 'object' ? (item.url || item.file_name) : item));
            if (onChange) onChange(urls);
        } else {
            const single = Array.isArray(selected) ? selected[0] : selected;
            const url = single ? (typeof single === 'object' ? (single.url || single.file_name) : single) : '';
            if (onChange) onChange(url);
        }
    };

    const handleRemoveItem = (indexToRemove, e) => {
        e.stopPropagation();
        if (multiple) {
            const updated = selectedList.filter((_, idx) => idx !== indexToRemove);
            if (onChange) onChange(updated);
        } else {
            if (onChange) onChange('');
        }
    };

    const displayText = selectedList.length > 0
        ? (selectedList.length === 1 ? t("1 File selected", "1 File selected") : `${selectedList.length} ${t("Files selected", "Files selected")}`)
        : t(placeholder, placeholder);

    return (
        <Box sx={{ width: '100%' }}>
            {label && (
                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75, color: '#334155' }}>
                    {label}
                </Typography>
            )}

            <UploadTriggerBar elevation={0} onClick={() => setModalOpen(true)}>
                <BrowseButton>
                    {t("Browse", "Browse")}
                </BrowseButton>
                <FileNameText sx={{ color: selectedList.length > 0 ? '#1e293b' : '#94a3b8' }}>
                    {displayText}
                </FileNameText>
            </UploadTriggerBar>

            {/* Thumbnail preview cards with circular close badge matching screenshots */}
            {selectedList.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1.5 }}>
                    {selectedList.map((item, idx) => {
                        const rawUrl = typeof item === 'object' ? (item.url || item.file_name) : item;
                        const previewSrc = resolvePreviewUrl(rawUrl);
                        const filename = String(rawUrl).split('/').pop() || 'file';
                        return (
                            <Box key={idx} sx={{ position: 'relative', display: 'inline-block' }}>
                                <Box
                                    sx={{
                                        width: 105,
                                        height: 105,
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0',
                                        p: 0.5,
                                        bgcolor: '#ffffff',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <img
                                        src={previewSrc}
                                        alt="preview"
                                        style={{ width: '100%', height: '70px', objectFit: 'cover', borderRadius: '4px' }}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    <Typography
                                        variant="caption"
                                        color="#64748b"
                                        noWrap
                                        sx={{ width: '100%', textAlign: 'center', mt: 0.5, fontSize: '0.65rem', fontWeight: 600 }}
                                    >
                                        {filename}
                                    </Typography>
                                </Box>

                                {/* Circular close badge */}
                                <IconButton
                                    size="small"
                                    onClick={(e) => handleRemoveItem(idx, e)}
                                    sx={{
                                        position: 'absolute',
                                        top: -7,
                                        right: -7,
                                        bgcolor: '#e0f2fe',
                                        color: '#0284c7',
                                        width: 20,
                                        height: 20,
                                        p: 0.2,
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                        '&:hover': { bgcolor: '#bae6fd' }
                                    }}
                                >
                                    <CloseIcon sx={{ fontSize: '0.8rem' }} />
                                </IconButton>
                            </Box>
                        );
                    })}
                </Box>
            )}

            {helperText && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block', fontSize: '0.72rem' }}>
                    {helperText}
                </Typography>
            )}

            {/* AIZ Uploader Modal */}
            <AizUploaderModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSelect={handleSelectFiles}
                selectedValues={selectedList}
                multiple={multiple}
                type={type}
            />
        </Box>
    );
};

export default AizUploaderInput;

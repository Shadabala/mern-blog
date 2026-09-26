import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Box, Paper, IconButton, Divider, Tooltip, Select,
    MenuItem, FormControl, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Popover, Typography, Grid, styled, Slider,
    InputLabel
} from '@mui/material';
import {
    FormatBold, FormatItalic, FormatUnderlined, StrikethroughS,
    FormatClear, FormatListBulleted, FormatListNumbered,
    FormatAlignLeft, FormatAlignCenter, FormatAlignRight, FormatAlignJustify,
    Code, InsertLink, ImageOutlined as ImageIcon,
    Undo, Redo, CodeOff, HorizontalRule,
    FormatColorText, BorderColor as FormatColorFill,
    Subscript as SubscriptIcon, Superscript as SuperscriptIcon,
    FormatIndentIncrease, FormatIndentDecrease,
    TableChart as TableIcon, SmartDisplay as VideoIcon,
    Fullscreen as FullscreenIcon, FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';

import AizUploaderModal from '../uploader/AizUploaderModal';
import { useLanguage } from '../../context/LanguageContext';

// Color Palette Swatches
const COLOR_PALETTE = [
    // Grayscale
    '#000000', '#1e293b', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#ffffff',
    // Red & Orange
    '#dc2626', '#ef4444', '#f87171', '#ea580c', '#f97316', '#fb923c', '#d97706',
    // Yellow & Green
    '#f59e0b', '#eab308', '#facc15', '#16a34a', '#22c55e', '#4ade80', '#059669',
    // Teal & Blue
    '#0d9488', '#14b8a6', '#0284c7', '#0ea5e9', '#38bdf8', '#2563eb', '#3b82f6',
    // Indigo, Purple & Pink
    '#4f46e5', '#6366f1', '#818cf8', '#7c3aed', '#8b5cf6', '#c084fc', '#db2777', '#ec4899'
];

const HIGHLIGHT_PALETTE = [
    'transparent',
    '#fef08a', '#fde047', '#fef9c3', // Yellow
    '#bbf7d0', '#86efac', '#dcfce7', // Green
    '#bae6fd', '#7dd3fc', '#e0f2fe', // Blue
    '#fbcfe8', '#f472b6', '#fdf2f8', // Pink
    '#fed7aa', '#fdba74', '#ffedd5', // Orange
    '#ddd6fe', '#c4b5fd', '#f5f3ff', // Purple
    '#e2e8f0', '#cbd5e1', '#f1f5f9', // Gray
    '#fecaca', '#f87171', '#fee2e2'  // Red
];

const FONT_FAMILIES = [
    { label: 'Default Font', value: 'inherit' },
    { label: 'Inter', value: 'Inter, sans-serif' },
    { label: 'Roboto', value: 'Roboto, sans-serif' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Times New Roman', value: '"Times New Roman", serif' },
    { label: 'Courier New', value: '"Courier New", monospace' },
    { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
];

const FONT_SIZES = [
    { label: '12px (Small)', value: '1' },
    { label: '14px (Normal)', value: '2' },
    { label: '16px (Medium)', value: '3' },
    { label: '18px (Large)', value: '4' },
    { label: '24px (XL)', value: '5' },
    { label: '32px (2XL)', value: '6' },
    { label: '40px (3XL)', value: '7' },
];

// Styled Components
const EditorContainer = styled(Paper)(({ theme, isFullscreen }) => ({
    border: '1px solid #d1d5db',
    borderRadius: isFullscreen ? 0 : '8px',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    ...(isFullscreen && {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1300,
        borderRadius: 0,
    }),
    '&:focus-within': {
        borderColor: theme.palette.primary.main,
        boxShadow: `0 0 0 2px rgba(124, 58, 237, 0.15)`
    }
}));

const Toolbar = styled(Box)`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    padding: 8px 12px;
    background-color: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    user-select: none;
`;

const ContentEditableArea = styled(Box)`
    padding: 20px;
    min-height: 280px;
    max-height: 600px;
    overflow-y: auto;
    outline: none;
    font-size: 0.95rem;
    line-height: 1.7;
    color: #1e293b;
    font-family: inherit;

    &[contenteditable="true"]:empty:before {
        content: attr(data-placeholder);
        color: #94a3b8;
        pointer-events: none;
        display: block;
    }

    & p {
        margin: 0 0 14px 0;
    }

    & h1, & h2, & h3, & h4, & h5, & h6 {
        margin: 18px 0 10px 0;
        font-weight: 700;
        color: #0f172a;
        line-height: 1.3;
    }

    & blockquote {
        border-left: 4px solid #7c3aed;
        margin: 16px 0;
        padding: 10px 18px;
        color: #475569;
        background-color: #f5f3ff;
        border-radius: 0 8px 8px 0;
        font-style: italic;
    }

    & pre {
        background-color: #0f172a;
        color: #38bdf8;
        padding: 14px 18px;
        border-radius: 8px;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 0.88rem;
        overflow-x: auto;
        margin: 14px 0;
    }

    & code {
        background-color: #f1f5f9;
        color: #e11d48;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.88rem;
        font-family: monospace;
    }

    & img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        margin: 12px 0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    & a {
        color: #2563eb;
        text-decoration: underline;
        cursor: pointer;
    }

    & ul, & ol {
        margin: 10px 0 14px 28px;
        padding-left: 8px;
    }

    & li {
        margin-bottom: 4px;
    }

    & table {
        width: 100%;
        border-collapse: collapse;
        margin: 16px 0;
        font-size: 0.9rem;
    }

    & th, & td {
        border: 1px solid #cbd5e1;
        padding: 10px 14px;
        text-align: left;
    }

    & th {
        background-color: #f8fafc;
        font-weight: 600;
        color: #1e293b;
    }

    & hr {
        border: none;
        border-top: 1px solid #e2e8f0;
        margin: 24px 0;
    }

    & iframe {
        max-width: 100%;
        border-radius: 8px;
        margin: 12px 0;
    }
`;

const RawHtmlTextarea = styled('textarea')`
    width: 100%;
    min-height: 280px;
    max-height: 600px;
    padding: 20px;
    border: none;
    outline: none;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.85rem;
    line-height: 1.6;
    background-color: #0f172a;
    color: #38bdf8;
    resize: vertical;
    box-sizing: border-box;
`;

const SwatchButton = styled(Box)(({ color, active }) => ({
    width: 24,
    height: 24,
    borderRadius: '4px',
    backgroundColor: color === 'transparent' ? '#ffffff' : color,
    border: active ? '2px solid #7c3aed' : '1px solid #cbd5e1',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.15s ease, border-color 0.15s',
    ...(color === 'transparent' && {
        backgroundImage: 'linear-gradient(45deg, #ef4444 25%, transparent 25%), linear-gradient(-45deg, #ef4444 25%, transparent 25%)',
        backgroundSize: '8px 8px',
        backgroundPosition: '0 0, 0 4px',
    }),
    '&:hover': {
        transform: 'scale(1.15)',
        zIndex: 2,
        borderColor: '#7c3aed'
    }
}));

const AizTextEditor = ({
    value = '',
    onChange,
    placeholder = 'Type your content here...',
    minHeight = 280,
    name = 'description'
}) => {
    const { t } = useLanguage();
    const editorRef = useRef(null);
    const savedSelectionRef = useRef(null);

    // States
    const [isCodeView, setIsCodeView] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [rawHtml, setRawHtml] = useState(value || '');

    // Formats
    const [blockType, setBlockType] = useState('p');
    const [fontFamily, setFontFamily] = useState('inherit');
    const [fontSize, setFontSize] = useState('3');
    const [foreColor, setForeColor] = useState('#1e293b');
    const [bgColor, setBgColor] = useState('transparent');

    // Dialog & Popover states
    const [colorAnchor, setColorAnchor] = useState(null);
    const [bgAnchor, setBgAnchor] = useState(null);
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');
    const [videoDialogOpen, setVideoDialogOpen] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');
    const [tableDialogOpen, setTableDialogOpen] = useState(false);
    const [tableRows, setTableRows] = useState(3);
    const [tableCols, setTableCols] = useState(3);
    const [tableHasHeader, setTableHasHeader] = useState(true);
    const [uploaderOpen, setUploaderOpen] = useState(false);

    // Sync external value
    useEffect(() => {
        if (editorRef.current && !isCodeView) {
            if (editorRef.current.innerHTML !== (value || '')) {
                editorRef.current.innerHTML = value || '';
            }
        }
        setRawHtml(value || '');
    }, [value, isCodeView]);

    // Save browser selection range
    const saveSelection = () => {
        if (window.getSelection) {
            const sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                savedSelectionRef.current = sel.getRangeAt(0);
            }
        }
    };

    // Restore browser selection range
    const restoreSelection = () => {
        if (savedSelectionRef.current && window.getSelection) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedSelectionRef.current);
        }
    };

    const handleContentChange = () => {
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            setRawHtml(html);
            if (onChange) {
                onChange(html);
            }
        }
    };

    const handleRawHtmlChange = (e) => {
        const html = e.target.value;
        setRawHtml(html);
        if (onChange) {
            onChange(html);
        }
    };

    // Execute standard execCommand
    const executeCommand = (command, val = null) => {
        if (isCodeView) return;
        restoreSelection();
        document.execCommand(command, false, val);
        if (editorRef.current) {
            editorRef.current.focus();
            handleContentChange();
        }
    };

    // Apply Fore (Text) Color
    const handleApplyTextColor = (color) => {
        setForeColor(color);
        restoreSelection();
        executeCommand('foreColor', color);
        setColorAnchor(null);
    };

    // Apply Background / Highlight Color
    const handleApplyBgColor = (color) => {
        setBgColor(color);
        restoreSelection();
        // Browser compatibility for hiliteColor / backColor
        if (!document.execCommand('hiliteColor', false, color)) {
            document.execCommand('backColor', false, color);
        }
        if (editorRef.current) {
            editorRef.current.focus();
            handleContentChange();
        }
        setBgAnchor(null);
    };

    // Block Format change
    const handleBlockFormatChange = (e) => {
        const tag = e.target.value;
        setBlockType(tag);
        if (tag === 'p') {
            executeCommand('formatBlock', '<p>');
        } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
            executeCommand('formatBlock', `<${tag}>`);
        } else if (tag === 'blockquote') {
            executeCommand('formatBlock', '<blockquote>');
        } else if (tag === 'pre') {
            executeCommand('formatBlock', '<pre>');
        }
    };

    // Font Family change
    const handleFontFamilyChange = (e) => {
        const font = e.target.value;
        setFontFamily(font);
        restoreSelection();
        executeCommand('fontName', font);
    };

    // Font Size change
    const handleFontSizeChange = (e) => {
        const size = e.target.value;
        setFontSize(size);
        restoreSelection();
        executeCommand('fontSize', size);
    };

    // Link Insertion
    const handleInsertLink = () => {
        if (!linkUrl) return;
        restoreSelection();
        if (linkText && editorRef.current) {
            const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
            executeCommand('insertHTML', linkHtml);
        } else {
            executeCommand('createLink', linkUrl);
        }
        setLinkDialogOpen(false);
        setLinkUrl('');
        setLinkText('');
    };

    // Image from AIZ Uploader
    const handleImageSelected = (file) => {
        if (!file) return;
        restoreSelection();
        const url = typeof file === 'object' ? (file.url || file.file_name) : file;
        const imgHtml = `<img src="${url}" alt="Image" class="img-fluid" style="max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0;" />`;
        executeCommand('insertHTML', imgHtml);
        setUploaderOpen(false);
    };

    // Video / YouTube Embed Insertion
    const handleInsertVideo = () => {
        if (!videoUrl) return;
        restoreSelection();
        let embedHtml = '';

        // If user pasted YouTube link
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
            let videoId = '';
            if (videoUrl.includes('youtu.be/')) {
                videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
            } else if (videoUrl.includes('watch?v=')) {
                videoId = videoUrl.split('watch?v=')[1]?.split('&')[0];
            }
            if (videoId) {
                embedHtml = `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 16px 0; border-radius: 8px;"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 8px;"></iframe></div>`;
            }
        } else if (videoUrl.trim().startsWith('<iframe')) {
            embedHtml = videoUrl;
        } else {
            // Generic video link
            embedHtml = `<div style="margin: 16px 0;"><video controls src="${videoUrl}" style="max-width: 100%; border-radius: 8px;"></video></div>`;
        }

        if (embedHtml) {
            executeCommand('insertHTML', embedHtml);
        }
        setVideoDialogOpen(false);
        setVideoUrl('');
    };

    // Table Insertion
    const handleInsertTable = () => {
        restoreSelection();
        const rows = Math.max(1, parseInt(tableRows, 10) || 3);
        const cols = Math.max(1, parseInt(tableCols, 10) || 3);

        let tableHtml = `<table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 0.95rem;">`;

        if (tableHasHeader) {
            tableHtml += `<thead><tr>`;
            for (let c = 1; c <= cols; c++) {
                tableHtml += `<th style="border: 1px solid #cbd5e1; padding: 10px 14px; background-color: #f8fafc; font-weight: 600;">Header ${c}</th>`;
            }
            tableHtml += `</tr></thead>`;
        }

        tableHtml += `<tbody>`;
        for (let r = 1; r <= rows; r++) {
            tableHtml += `<tr>`;
            for (let c = 1; c <= cols; c++) {
                tableHtml += `<td style="border: 1px solid #cbd5e1; padding: 10px 14px;">Cell ${r}-${c}</td>`;
            }
            tableHtml += `</tr>`;
        }
        tableHtml += `</tbody></table><p><br></p>`;

        executeCommand('insertHTML', tableHtml);
        setTableDialogOpen(false);
    };

    return (
        <Box sx={{ position: 'relative' }}>
            <EditorContainer elevation={isFullscreen ? 8 : 0} isFullscreen={isFullscreen}>
                {/* Full-Featured AIZ Rich Toolbar */}
                <Toolbar>
                    {/* 1. Typography & Hierarchy */}
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                            value={blockType}
                            onChange={handleBlockFormatChange}
                            disabled={isCodeView}
                            sx={{ height: 32, fontSize: '0.8rem', bgcolor: '#fff' }}
                        >
                            <MenuItem value="p">{t("editor.normal", "Paragraph")}</MenuItem>
                            <MenuItem value="h1"><strong>{t("editor.h1", "Heading 1")}</strong></MenuItem>
                            <MenuItem value="h2"><strong>{t("editor.h2", "Heading 2")}</strong></MenuItem>
                            <MenuItem value="h3"><strong>{t("editor.h3", "Heading 3")}</strong></MenuItem>
                            <MenuItem value="h4"><strong>{t("editor.h4", "Heading 4")}</strong></MenuItem>
                            <MenuItem value="h5"><strong>{t("editor.h5", "Heading 5")}</strong></MenuItem>
                            <MenuItem value="h6"><strong>{t("editor.h6", "Heading 6")}</strong></MenuItem>
                            <MenuItem value="blockquote">{t("editor.quote", "Quote Block")}</MenuItem>
                            <MenuItem value="pre">{t("editor.codeBlock", "Code Block")}</MenuItem>
                        </Select>
                    </FormControl>

                    {/* 2. Font Family */}
                    <FormControl size="small" sx={{ minWidth: 125 }}>
                        <Select
                            value={fontFamily}
                            onChange={handleFontFamilyChange}
                            disabled={isCodeView}
                            sx={{ height: 32, fontSize: '0.8rem', bgcolor: '#fff' }}
                        >
                            {FONT_FAMILIES.map(f => (
                                <MenuItem key={f.value} value={f.value} sx={{ fontFamily: f.value, fontSize: '0.82rem' }}>
                                    {f.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* 3. Font Size */}
                    <FormControl size="small" sx={{ minWidth: 110 }}>
                        <Select
                            value={fontSize}
                            onChange={handleFontSizeChange}
                            disabled={isCodeView}
                            sx={{ height: 32, fontSize: '0.8rem', bgcolor: '#fff' }}
                        >
                            {FONT_SIZES.map(s => (
                                <MenuItem key={s.value} value={s.value} sx={{ fontSize: '0.82rem' }}>
                                    {s.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, my: 'auto' }} />

                    {/* 4. Font Styles */}
                    <Tooltip title={t("editor.bold", "Bold (Ctrl+B)")}>
                        <span>
                            <IconButton size="small" onClick={() => executeCommand('bold')} disabled={isCodeView}>
                                <FormatBold fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={t("editor.italic", "Italic (Ctrl+I)")}>
                        <span>
                            <IconButton size="small" onClick={() => executeCommand('italic')} disabled={isCodeView}>
                                <FormatItalic fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={t("editor.underline", "Underline (Ctrl+U)")}>
                        <span>
                            <IconButton size="small" onClick={() => executeCommand('underline')} disabled={isCodeView}>
                                <FormatUnderlined fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={t("editor.strike", "Strikethrough")}>
                        <span>
                            <IconButton size="small" onClick={() => executeCommand('strikeThrough')} disabled={isCodeView}>
                                <StrikethroughS fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>

                    {/* Subscript & Superscript */}
                    <Tooltip title={t("editor.subscript", "Subscript")}>
                        <span>
                            <IconButton size="small" onClick={() => executeCommand('subscript')} disabled={isCodeView}>
                                <SubscriptIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={t("editor.superscript", "Superscript")}>
                        <span>
                            <IconButton size="small" onClick={() => executeCommand('superscript')} disabled={isCodeView}>
                                <SuperscriptIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>

                    <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, my: 'auto' }} />

                    {/* 5. Text Color & Background / Highlight Color */}
                    <Tooltip title={t("editor.textColor", "Text Color")}>
                        <span>
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    saveSelection();
                                    setColorAnchor(e.currentTarget);
                                }}
                                disabled={isCodeView}
                                sx={{ flexDirection: 'column', p: 0.5 }}
                            >
                                <FormatColorText fontSize="small" sx={{ color: foreColor !== '#1e293b' ? foreColor : 'inherit' }} />
                                <Box sx={{ width: 16, height: 3, bgcolor: foreColor, borderRadius: '2px', mt: '1px' }} />
                            </IconButton>
                        </span>
                    </Tooltip>

                    <Tooltip title={t("editor.bgColor", "Background / Highlight Color")}>
                        <span>
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    saveSelection();
                                    setBgAnchor(e.currentTarget);
                                }}
                                disabled={isCodeView}
                                sx={{ flexDirection: 'column', p: 0.5 }}
                            >
                                <FormatColorFill fontSize="small" sx={{ color: bgColor !== 'transparent' ? bgColor : 'inherit' }} />
                                <Box sx={{ width: 16, height: 3, bgcolor: bgColor !== 'transparent' ? bgColor : '#cbd5e1', borderRadius: '2px', mt: '1px' }} />
                            </IconButton>
                        </span>
                    </Tooltip>

                    <Tooltip title={t("editor.clearFormat", "Clear All Formatting")}>
                        <span>
                            <IconButton size="small" onClick={() => executeCommand('removeFormat')} disabled={isCodeView}>
                                <FormatClear fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>

                    <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, my: 'auto' }} />

                    {/* 6. Alignment & Indent */}
                    <Tooltip title={t("editor.alignLeft", "Align Left")}>
                        <span>
                            <IconButton size="small" onClick={() => executeCommand('justifyLeft')} disabled={isCodeView}>
                                <FormatAlignLeft fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={t("editor.alignCenter", "Align Center")}>
                        <span>
                            <IconButton size="small" onClick={() => executeCommand('justifyCenter')} disabled={isCodeView}>
                                <FormatAlignCenter fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={t("editor.alignRight", "Align Right")}>
                        <span>
                            <IconButton size="small" onClick={() => executeCommand('justifyRight')} disabled={isCodeView}>
                                <FormatAlignRight fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={t("editor.justify", "Justify")}>
                        <span>
                            <IconButton size="small" onClick={() => executeCommand('justifyFull')} disabled={isCodeView}>
                                <FormatAlignJustify fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>

                    <Tooltip title={t("editor.indent", "Increase Indent")}>
                        <span>
                            <IconButton size="small" onClick={() => executeCommand('indent')} disabled={isCodeView}>
                                <FormatIndentIncrease fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={t("editor.outdent", "Decrease Indent")}>
                        <span>
                            <IconButton size="small" onClick={() => executeCommand('outdent')} disabled={isCodeView}>
                                <FormatIndentDecrease fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>

                    <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, my: 'auto' }} />

                    {/* 7. Lists */}
                    <Tooltip title={t("editor.bulletList", "Bullet List")}>
                        <span>
                            <IconButton size="small" onClick={() => executeCommand('insertUnorderedList')} disabled={isCodeView}>
                                <FormatListBulleted fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={t("editor.numberList", "Numbered List")}>
                        <span>
                            <IconButton size="small" onClick={() => executeCommand('insertOrderedList')} disabled={isCodeView}>
                                <FormatListNumbered fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>

                    <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, my: 'auto' }} />

                    {/* 8. Insert Objects: Link, Image, Video, Table, Horizontal Line */}
                    <Tooltip title={t("editor.insertLink", "Insert Link")}>
                        <span>
                            <IconButton
                                size="small"
                                onClick={() => {
                                    saveSelection();
                                    setLinkDialogOpen(true);
                                }}
                                disabled={isCodeView}
                            >
                                <InsertLink fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={t("editor.insertImage", "Insert Image (AIZ Uploader)")}>
                        <span>
                            <IconButton
                                size="small"
                                onClick={() => {
                                    saveSelection();
                                    setUploaderOpen(true);
                                }}
                                disabled={isCodeView}
                                color="primary"
                            >
                                <ImageIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={t("editor.insertVideo", "Insert Video / Embed")}>
                        <span>
                            <IconButton
                                size="small"
                                onClick={() => {
                                    saveSelection();
                                    setVideoDialogOpen(true);
                                }}
                                disabled={isCodeView}
                            >
                                <VideoIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={t("editor.insertTable", "Insert Table")}>
                        <span>
                            <IconButton
                                size="small"
                                onClick={() => {
                                    saveSelection();
                                    setTableDialogOpen(true);
                                }}
                                disabled={isCodeView}
                            >
                                <TableIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={t("editor.horizontalRule", "Horizontal Line")}>
                        <span>
                            <IconButton size="small" onClick={() => executeCommand('insertHorizontalRule')} disabled={isCodeView}>
                                <HorizontalRule fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>

                    <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, my: 'auto' }} />

                    {/* 9. History: Undo / Redo */}
                    <Tooltip title={t("editor.undo", "Undo (Ctrl+Z)")}>
                        <span>
                            <IconButton size="small" onClick={() => executeCommand('undo')} disabled={isCodeView}>
                                <Undo fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={t("editor.redo", "Redo (Ctrl+Y)")}>
                        <span>
                            <IconButton size="small" onClick={() => executeCommand('redo')} disabled={isCodeView}>
                                <Redo fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>

                    {/* 10. Fullscreen & Code View Toggle */}
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip title={isFullscreen ? t("editor.exitFullscreen", "Exit Fullscreen") : t("editor.fullscreen", "Fullscreen")}>
                            <IconButton
                                size="small"
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                color={isFullscreen ? "primary" : "default"}
                            >
                                {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
                            </IconButton>
                        </Tooltip>

                        <Tooltip title={isCodeView ? t("editor.visualView", "Visual Editor") : t("editor.codeView", "HTML Code View")}>
                            <IconButton
                                size="small"
                                onClick={() => setIsCodeView(!isCodeView)}
                                color={isCodeView ? "primary" : "default"}
                                sx={{ bgcolor: isCodeView ? '#e0e7ff' : 'transparent' }}
                            >
                                {isCodeView ? <CodeOff fontSize="small" /> : <Code fontSize="small" />}
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Toolbar>

                {/* Text Color Popover */}
                <Popover
                    open={Boolean(colorAnchor)}
                    anchorEl={colorAnchor}
                    onClose={() => setColorAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                    PaperProps={{ sx: { p: 2, width: 260, borderRadius: 2 } }}
                >
                    <Typography variant="caption" fontWeight={700} color="#475569" display="block" mb={1.2}>
                        {t("editor.textColorPalette", "Text Color")}
                    </Typography>
                    <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={0.8} mb={1.5}>
                        {COLOR_PALETTE.map(c => (
                            <SwatchButton
                                key={c}
                                color={c}
                                active={foreColor.toLowerCase() === c.toLowerCase()}
                                onClick={() => handleApplyTextColor(c)}
                                title={c}
                            />
                        ))}
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                        <Typography variant="caption" color="textSecondary">{t("editor.customColor", "Custom Color")}:</Typography>
                        <input
                            type="color"
                            value={foreColor.startsWith('#') ? foreColor : '#000000'}
                            onChange={(e) => handleApplyTextColor(e.target.value)}
                            style={{ width: 34, height: 28, cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: 4, padding: 0 }}
                        />
                    </Box>
                </Popover>

                {/* Background / Highlight Color Popover */}
                <Popover
                    open={Boolean(bgAnchor)}
                    anchorEl={bgAnchor}
                    onClose={() => setBgAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                    PaperProps={{ sx: { p: 2, width: 260, borderRadius: 2 } }}
                >
                    <Typography variant="caption" fontWeight={700} color="#475569" display="block" mb={1.2}>
                        {t("editor.highlightColorPalette", "Highlight / Background Color")}
                    </Typography>
                    <Box display="grid" gridTemplateColumns="repeat(6, 1fr)" gap={0.8} mb={1.5}>
                        {HIGHLIGHT_PALETTE.map(c => (
                            <SwatchButton
                                key={c}
                                color={c}
                                active={bgColor.toLowerCase() === c.toLowerCase()}
                                onClick={() => handleApplyBgColor(c)}
                                title={c === 'transparent' ? 'Clear Highlight' : c}
                            />
                        ))}
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                        <Button
                            size="small"
                            variant="text"
                            color="inherit"
                            onClick={() => handleApplyBgColor('transparent')}
                            sx={{ textTransform: 'none', fontSize: '0.75rem', p: 0.5 }}
                        >
                            {t("editor.removeHighlight", "No Highlight")}
                        </Button>
                        <input
                            type="color"
                            value={bgColor.startsWith('#') ? bgColor : '#fef08a'}
                            onChange={(e) => handleApplyBgColor(e.target.value)}
                            style={{ width: 34, height: 28, cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: 4, padding: 0 }}
                        />
                    </Box>
                </Popover>

                {/* Content Area */}
                {isCodeView ? (
                    <RawHtmlTextarea
                        value={rawHtml}
                        onChange={handleRawHtmlChange}
                        placeholder="<p>Enter raw HTML here...</p>"
                        name={name}
                        style={{ height: isFullscreen ? 'calc(100vh - 60px)' : minHeight, maxHeight: isFullscreen ? 'none' : 600 }}
                    />
                ) : (
                    <ContentEditableArea
                        ref={editorRef}
                        contentEditable
                        onInput={handleContentChange}
                        onBlur={handleContentChange}
                        onSelect={saveSelection}
                        onKeyUp={saveSelection}
                        onMouseUp={saveSelection}
                        data-placeholder={placeholder}
                        sx={{
                            minHeight: isFullscreen ? 'calc(100vh - 60px)' : minHeight,
                            maxHeight: isFullscreen ? 'none' : 600
                        }}
                    />
                )}
            </EditorContainer>

            {/* Hidden textarea for form submission */}
            <textarea
                name={name}
                className="aiz-text-editor"
                value={rawHtml}
                onChange={() => {}}
                style={{ display: 'none' }}
            />

            {/* Link Dialog */}
            <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{t("editor.insertLink", "Insert Link")}</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        size="small"
                        label={t("editor.linkText", "Link Text (Optional)")}
                        value={linkText}
                        onChange={(e) => setLinkText(e.target.value)}
                        sx={{ mt: 1, mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        size="small"
                        label={t("editor.linkUrl", "URL")}
                        placeholder="https://example.com"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setLinkDialogOpen(false)}>{t("editor.cancel", "Cancel")}</Button>
                    <Button variant="outlined" className="btn-outline-primary" onClick={handleInsertLink}>{t("editor.insert", "Insert")}</Button>
                </DialogActions>
            </Dialog>

            {/* Video / Embed Dialog */}
            <Dialog open={videoDialogOpen} onClose={() => setVideoDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{t("editor.insertVideo", "Insert Video / Embed")}</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        size="small"
                        label={t("editor.videoUrl", "YouTube URL, Video Link, or <iframe> Embed")}
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        sx={{ mt: 1 }}
                        multiline
                        rows={3}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setVideoDialogOpen(false)}>{t("editor.cancel", "Cancel")}</Button>
                    <Button variant="outlined" className="btn-outline-primary" onClick={handleInsertVideo}>{t("editor.insert", "Insert")}</Button>
                </DialogActions>
            </Dialog>

            {/* Table Dialog */}
            <Dialog open={tableDialogOpen} onClose={() => setTableDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{t("editor.insertTable", "Insert Table")}</DialogTitle>
                <DialogContent>
                    <Box display="flex" gap={2} mt={1}>
                        <TextField
                            size="small"
                            type="number"
                            label={t("editor.rows", "Rows")}
                            value={tableRows}
                            onChange={(e) => setTableRows(e.target.value)}
                            inputProps={{ min: 1, max: 20 }}
                        />
                        <TextField
                            size="small"
                            type="number"
                            label={t("editor.cols", "Columns")}
                            value={tableCols}
                            onChange={(e) => setTableCols(e.target.value)}
                            inputProps={{ min: 1, max: 10 }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setTableDialogOpen(false)}>{t("editor.cancel", "Cancel")}</Button>
                    <Button variant="outlined" className="btn-outline-primary" onClick={handleInsertTable}>{t("editor.insert", "Insert Table")}</Button>
                </DialogActions>
            </Dialog>

            {/* AIZ Uppy Uploader Modal for Images */}
            <AizUploaderModal
                open={uploaderOpen}
                onClose={() => setUploaderOpen(false)}
                onSelect={handleImageSelected}
                multiple={false}
                type="image"
            />
        </Box>
    );
};

export default AizTextEditor;

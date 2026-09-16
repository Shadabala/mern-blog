import React, { useState, useRef, useEffect } from 'react';
import {
    Box, Paper, IconButton, Divider, Tooltip, Select,
    MenuItem, FormControl, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, styled
} from '@mui/material';
import {
    FormatBold, FormatItalic, FormatUnderlined, StrikethroughS,
    FormatClear, FormatListBulleted, FormatListNumbered,
    FormatAlignLeft, FormatAlignCenter, FormatAlignRight, FormatAlignJustify,
    Code, InsertLink, ImageOutlined as ImageIcon,
    Undo, Redo, CodeOff, HorizontalRule
} from '@mui/icons-material';

import AizUploaderModal from '../uploader/AizUploaderModal';
import { useLanguage } from '../../context/LanguageContext';

const EditorContainer = styled(Paper)(({ theme }) => ({
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    transition: 'border-color 0.2s',
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
`;

const ContentEditableArea = styled(Box)`
    padding: 16px;
    min-height: 260px;
    max-height: 600px;
    overflow-y: auto;
    outline: none;
    font-size: 0.95rem;
    line-height: 1.6;
    color: #1e293b;
    font-family: inherit;

    &[contenteditable="true"]:empty:before {
        content: attr(data-placeholder);
        color: #94a3b8;
        pointer-events: none;
        display: block;
    }

    & p {
        margin: 0 0 12px 0;
    }

    & h1, & h2, & h3, & h4 {
        margin: 16px 0 8px 0;
        font-weight: 700;
        color: #0f172a;
    }

    & blockquote {
        border-left: 4px solid #7c3aed;
        margin: 12px 0;
        padding: 6px 16px;
        color: #475569;
        background-color: #f5f3ff;
        border-radius: 0 6px 6px 0;
    }

    & pre {
        background-color: #1e293b;
        color: #f8fafc;
        padding: 12px;
        border-radius: 6px;
        font-family: monospace;
        overflow-x: auto;
    }

    & img {
        max-width: 100%;
        height: auto;
        border-radius: 6px;
        margin: 8px 0;
    }

    & a {
        color: #7c3aed;
        text-decoration: underline;
    }

    & ul, & ol {
        margin: 8px 0 12px 24px;
    }
`;

const RawHtmlTextarea = styled('textarea')`
    width: 100%;
    min-height: 260px;
    max-height: 600px;
    padding: 16px;
    border: none;
    outline: none;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.85rem;
    line-height: 1.5;
    background-color: #0f172a;
    color: #38bdf8;
    resize: vertical;
    box-sizing: border-box;
`;

const AizTextEditor = ({
    value = '',
    onChange,
    placeholder = 'Type your content here...',
    minHeight = 260,
    name = 'description'
}) => {
    const { t } = useLanguage();
    const editorRef = useRef(null);

    const [isCodeView, setIsCodeView] = useState(false);
    const [rawHtml, setRawHtml] = useState(value || '');
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');
    const [uploaderOpen, setUploaderOpen] = useState(false);
    const [blockType, setBlockType] = useState('p');

    // Sync external value with editor content
    useEffect(() => {
        if (editorRef.current && !isCodeView) {
            if (editorRef.current.innerHTML !== (value || '')) {
                editorRef.current.innerHTML = value || '';
            }
        }
        setRawHtml(value || '');
    }, [value, isCodeView]);

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

    const executeCommand = (command, val = null) => {
        if (isCodeView) return;
        document.execCommand(command, false, val);
        if (editorRef.current) {
            editorRef.current.focus();
            handleContentChange();
        }
    };

    const handleBlockFormatChange = (e) => {
        const tag = e.target.value;
        setBlockType(tag);
        if (tag === 'p') {
            executeCommand('formatBlock', '<p>');
        } else if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4') {
            executeCommand('formatBlock', `<${tag}>`);
        } else if (tag === 'blockquote') {
            executeCommand('formatBlock', '<blockquote>');
        } else if (tag === 'pre') {
            executeCommand('formatBlock', '<pre>');
        }
    };

    const handleInsertLink = () => {
        if (!linkUrl) return;
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

    // Callback when an image is selected from AIZ Uppy Uploader
    const handleImageSelected = (file) => {
        if (!file) return;
        const url = typeof file === 'object' ? (file.url || file.file_name) : file;
        const imgHtml = `<img src="${url}" alt="Embedded Image" class="img-fluid" style="max-width: 100%; height: auto; border-radius: 6px; margin: 8px 0;" />`;
        executeCommand('insertHTML', imgHtml);
        setUploaderOpen(false);
    };

    return (
        <Box>
            <EditorContainer elevation={0}>
                {/* AIZ Summernote-style Toolbar */}
                <Toolbar>
                    {/* Paragraph / Heading Selector */}
                    <FormControl size="small" sx={{ minWidth: 110, mr: 0.5 }}>
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
                            <MenuItem value="blockquote">{t("editor.quote", "Quote")}</MenuItem>
                            <MenuItem value="pre">{t("editor.code", "Code")}</MenuItem>
                        </Select>
                    </FormControl>

                    <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, my: 'auto' }} />

                    {/* Font Styles */}
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
                    <Tooltip title={t("editor.clear", "Clear Formatting")}>
                        <span>
                            <IconButton size="small" onClick={() => executeCommand('removeFormat')} disabled={isCodeView}>
                                <FormatClear fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>

                    <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, my: 'auto' }} />

                    {/* Lists */}
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

                    {/* Alignments */}
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

                    <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, my: 'auto' }} />

                    {/* Insert Link & Image & Divider */}
                    <Tooltip title={t("editor.insertLink", "Insert Link")}>
                        <span>
                            <IconButton size="small" onClick={() => setLinkDialogOpen(true)} disabled={isCodeView}>
                                <InsertLink fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={t("editor.insertImage", "Insert Image (AIZ Uploader)")}>
                        <span>
                            <IconButton size="small" onClick={() => setUploaderOpen(true)} disabled={isCodeView} color="primary">
                                <ImageIcon fontSize="small" />
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

                    {/* Undo & Redo */}
                    <Tooltip title={t("editor.undo", "Undo")}>
                        <span>
                            <IconButton size="small" onClick={() => executeCommand('undo')} disabled={isCodeView}>
                                <Undo fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={t("editor.redo", "Redo")}>
                        <span>
                            <IconButton size="small" onClick={() => executeCommand('redo')} disabled={isCodeView}>
                                <Redo fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>

                    {/* Toggle Code View / HTML Source Mode */}
                    <Box sx={{ ml: 'auto' }}>
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

                {/* Editor Content Area */}
                {isCodeView ? (
                    <RawHtmlTextarea
                        value={rawHtml}
                        onChange={handleRawHtmlChange}
                        placeholder="<p>Enter raw HTML here...</p>"
                        name={name}
                    />
                ) : (
                    <ContentEditableArea
                        ref={editorRef}
                        contentEditable
                        onInput={handleContentChange}
                        onBlur={handleContentChange}
                        data-placeholder={placeholder}
                        sx={{ minHeight }}
                    />
                )}
            </EditorContainer>

            {/* Hidden textarea for standard form bindings */}
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
                        label={t("editor.linkText", "Link Text")}
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
                    <Button variant="contained" onClick={handleInsertLink}>{t("editor.insert", "Insert")}</Button>
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

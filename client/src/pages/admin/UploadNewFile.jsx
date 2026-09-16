import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardHeader, CardContent, Typography, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import UppyUploader from '../../components/uploader/UppyUploader';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../utils/toast';

const UploadNewFile = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    const handleUploadSuccess = (file, responseBody) => {
        console.log('File uploaded via Uppy:', file, responseBody);
    };

    const handleComplete = (result) => {
        console.log('Upload batch completed:', result);
        if (result?.successful && result.successful.length > 0) {
            toast.success(t("uploader.uploadComplete", `${result.successful.length} file(s) uploaded successfully!`));
        }
        if (result?.failed && result.failed.length > 0) {
            toast.error(t("uploader.uploadFailed", `${result.failed.length} file(s) failed to upload.`));
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Top Titlebar matching Laravel base-module create.blade.php */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Typography variant="h5" fontWeight={700} color="#1e293b">
                    {t("Upload New File", "Upload New File")}
                </Typography>

                <Button
                    variant="text"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/admin/uploaded-files')}
                    sx={{ textTransform: 'none', fontWeight: 600, color: '#475569' }}
                >
                    {t("Back to uploaded files", "Back to uploaded files")}
                </Button>
            </Box>

            {/* Uploader Card */}
            <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <CardHeader
                    title={
                        <Typography variant="subtitle1" fontWeight={700} color="#334155">
                            {t("Drag & drop your files", "Drag & drop your files")}
                        </Typography>
                    }
                    sx={{ borderBottom: '1px solid #f1f5f9', pb: 2 }}
                />
                <CardContent sx={{ p: 3, minHeight: '60vh' }}>
                    <UppyUploader
                        onUploadSuccess={handleUploadSuccess}
                        onComplete={handleComplete}
                        height={480}
                    />
                </CardContent>
            </Card>
        </Box>
    );
};

export default UploadNewFile;

import React, { useEffect, useRef } from 'react';
import Uppy from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import XHRUpload from '@uppy/xhr-upload';

import '@uppy/core/css/style.min.css';
import '@uppy/dashboard/css/style.min.css';
import { getAccessToken } from '../../utils/common-utils';
import { useLanguage } from '../../context/LanguageContext';

const UppyUploader = ({
    onUploadSuccess,
    onComplete,
    maxFileSize = 100 * 1024 * 1024,
    allowedFileTypes = null,
    type = 'all',
    height = 400
}) => {
    const containerRef = useRef(null);
    const uppyRef = useRef(null);
    const { t } = useLanguage();

    useEffect(() => {
        if (!containerRef.current) return;

        // Cleanup any previous instance
        if (uppyRef.current) {
            try {
                if (typeof uppyRef.current.destroy === 'function') {
                    uppyRef.current.destroy();
                } else if (typeof uppyRef.current.close === 'function') {
                    uppyRef.current.close();
                }
            } catch (err) {
                console.warn('Uppy cleanup error:', err);
            }
            uppyRef.current = null;
        }

        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const uploadEndpoint = `${API_URL}/api/aiz-uploader/upload`;

        const effectiveAllowedTypes = allowedFileTypes || (
            type === 'image'
                ? ['image/*']
                : type === 'video'
                    ? ['video/*']
                    : type === 'audio'
                        ? ['audio/*']
                        : null
        );

        const uppy = new Uppy({
            id: 'aiz-uppy-instance',
            autoProceed: true,
            restrictions: {
                maxFileSize: maxFileSize,
                allowedFileTypes: effectiveAllowedTypes,
            }
        });

        uppy.use(Dashboard, {
            target: containerRef.current,
            inline: true,
            height: height,
            width: '100%',
            showLinkToFileUploadResult: false,
            showProgressDetails: true,
            hideCancelButton: false,
            hidePauseResumeButton: true,
            hideUploadButton: true,
            proudlyDisplayPoweredByUppy: false,
            note: t("Images, videos and documents up to 100MB", "Images, videos and documents up to 100MB"),
            locale: {
                strings: {
                    dropPasteFiles: t("Drop files here or %{browse}", "Drop files here or %{browse}"),
                    browse: t("Browse", "Browse"),
                    addMoreFiles: t("Add more files", "Add more files"),
                    uploadComplete: t("Upload complete", "Upload complete"),
                    uploading: t("Uploading", "Uploading"),
                    complete: t("Complete", "Complete"),
                }
            }
        });

        // Get auth token for upload request
        let token = getAccessToken() || sessionStorage.getItem('accessToken') || '';
        if (token && !token.startsWith('Bearer ')) {
            token = `Bearer ${token}`;
        }

        uppy.use(XHRUpload, {
            endpoint: uploadEndpoint,
            fieldName: 'aiz_file',
            formData: true,
            headers: {
                ...(token ? { 'Authorization': token } : {})
            },
            withCredentials: true
        });

        uppy.on('upload-success', (file, response) => {
            if (onUploadSuccess) {
                onUploadSuccess(file, response.body);
            }
        });

        uppy.on('complete', (result) => {
            if (onComplete) {
                onComplete(result);
            }
        });

        uppyRef.current = uppy;

        return () => {
            if (uppyRef.current) {
                try {
                    if (typeof uppyRef.current.destroy === 'function') {
                        uppyRef.current.destroy();
                    } else if (typeof uppyRef.current.close === 'function') {
                        uppyRef.current.close();
                    }
                } catch (err) {
                    console.warn('Uppy unmount error:', err);
                }
                uppyRef.current = null;
            }
        };
    }, [maxFileSize, allowedFileTypes, type, height, onUploadSuccess, onComplete, t]);

    return (
        <div style={{ width: '100%', height: '100%', minHeight: height }}>
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
};

export default UppyUploader;

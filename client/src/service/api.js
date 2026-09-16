import axios from 'axios';

import { API_NOTIFICATION_MESSAGES, SERVICE_URLS } from '../constants/config';
import { getAccessToken, getType } from '../utils/common-utils';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const axiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 10000
});

axiosInstance.interceptors.request.use(
    function(config) {
        const appLang = localStorage.getItem('app_language') || 'en';
        if (!config.headers) config.headers = {};
        config.headers['x-language-code'] = appLang;
        config.headers['Accept-Language'] = appLang;

        const token = getAccessToken();
        if (token && !config.headers['authorization']) {
            config.headers['authorization'] = token;
        }

        if (config.TYPE?.params) {
            config.params = { ...config.TYPE.params };
            if (!config.params.lang) {
                config.params.lang = appLang;
            }
        } else if (config.TYPE?.query) {
            config.url = config.url + '/' + config.TYPE.query;
            if (!config.params) config.params = {};
            if (!config.params.lang) config.params.lang = appLang;
        } else {
            if (!config.params) config.params = {};
            if (!config.params.lang) config.params.lang = appLang;
        }
        return config;
    },
    function(error) {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    function(response) {
        return processResponse(response);
    },
    async function(error) {
        const originalRequest = error.config;

        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry &&
            originalRequest.url !== '/login' &&
            originalRequest.url !== '/signup' &&
            originalRequest.url !== '/token'
        ) {
            originalRequest._retry = true;
            try {
                const refreshToken = sessionStorage.getItem('refreshToken');
                if (refreshToken) {
                    const res = await axios.post(`${API_URL}/token`, { token: refreshToken });
                    
                    if (res.status === 200 && res.data.accessToken) {
                        const newAccessToken = res.data.accessToken;
                        sessionStorage.setItem('accessToken', `Bearer ${newAccessToken}`);
                        
                        originalRequest.headers['authorization'] = `Bearer ${newAccessToken}`;
                        
                        // Use raw axios to retry the request to avoid re-triggering request interceptor URL manipulation
                        return axios(originalRequest);
                    }
                }
            } catch (refreshError) {
                console.error("Session expired during token refresh:", refreshError);
            }
        }

        return Promise.resolve(await ProcessError(error));
    }
);

///////////////////////////////
// If success -> returns { isSuccess: true, data: object }
// If fail    -> returns { isFailure: true, status, msg, code }
//////////////////////////////
const processResponse = (response) => {
    if (response?.status >= 200 && response?.status < 300) {
        return { isSuccess: true, data: response.data };
    } else {
        return {
            isFailure: true,
            isSuccess: false,
            status: response?.status,
            msg: response?.data?.message || response?.data?.msg || response?.msg,
            code: response?.code,
            data: response?.data
        };
    }
};

///////////////////////////////
// If success -> returns { isSuccess: true, data: object }
// If fail    -> returns { isError: true, status, msg, code }
////////////////////////////
const ProcessError = async (error) => {
    if (error.response) {
        if (error.response?.status === 401) {
            sessionStorage.removeItem('accessToken');
            localStorage.removeItem('accessToken');
            window.location.href = '/login';
            return {
                isError: true,
                isSuccess: false,
                msg: 'Session expired. Please log in again.',
                code: error.response.status
            };
        } else {
            const serverMsg = error.response?.data?.message || error.response?.data?.msg || API_NOTIFICATION_MESSAGES.responseFailure;
            console.log('ERROR IN RESPONSE: ', error.toJSON ? error.toJSON() : error);
            return {
                isError: true,
                isSuccess: false,
                msg: serverMsg,
                code: error.response.status,
                data: error.response?.data
            };
        }
    } else if (error.request) {
        console.log('ERROR IN REQUEST: ', error.toJSON ? error.toJSON() : error);
        return {
            isError: true,
            isSuccess: false,
            msg: API_NOTIFICATION_MESSAGES.requestFailure,
            code: ''
        };
    } else {
        console.log('ERROR IN RESPONSE: ', error.toJSON());
        return {
            isError: true,
            msg: API_NOTIFICATION_MESSAGES.networkError,
            code: ''
        };
    }
};

const API = {};

for (const [key, value] of Object.entries(SERVICE_URLS)) {
    API[key] = (body, showUploadProgress, showDownloadProgress) =>
        axiosInstance({
            method: value.method,
            url: value.url,
            data: value.method === 'DELETE' ? '' : body,
            responseType: value.responseType,
            headers: {
                authorization: getAccessToken(),
            },
            TYPE: getType(value, body),
            onUploadProgress: function(progressEvent) {
                if (showUploadProgress) {
                    let percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    showUploadProgress(percentCompleted);
                }
            },
            onDownloadProgress: function(progressEvent) {
                if (showDownloadProgress) {
                    let percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    showDownloadProgress(percentCompleted);
                }
            }
        });
}

export { API };

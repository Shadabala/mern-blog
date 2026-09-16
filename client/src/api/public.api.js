import api from "./axios";

export const fetchPublicBlogs = async (params = {}) => {
    const response = await api.get("/blog", { params: { ...params, status: true } });
    return response.data;
};

export const fetchPublicBlogDetail = async (id, params = {}) => {
    const response = await api.get(`/blog/${id}`, { params: { ...params, status: true } });
    return response.data;
};

// Backward-compatibility aliases
export const fetchPublicPosts = fetchPublicBlogs;
export const fetchPublicPostDetail = fetchPublicBlogDetail;

export const fetchPublicCategories = async (params = {}) => {
    const response = await api.get("/category", { params: { ...params, status: true } });
    return response.data;
};

export const fetchPublicSettings = async () => {
    const response = await api.get("/public/settings");
    return response.data;
};

export const fetchPublicHomepageSettings = async (lang = 'en') => {
    const response = await api.get("/public/website-settings/homepage", { params: { lang } });
    return response.data;
};

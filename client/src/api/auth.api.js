import api from "./axios";

export const signupUser = async (data) => {
    const response = await api.post("/auth/signup", data);
    return response.data;
};

export const loginUser = async (data) => {
    const response = await api.post("/auth/login", data);
    if (response.data?.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
    }
    if (response.data?.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
};

export const verify2faApi = async (data) => {
    const response = await api.post("/auth/2fa/verify", data);
    if (response.data?.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
    }
    if (response.data?.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
};

export const resend2faOtpApi = async (data) => {
    const response = await api.post("/auth/2fa/resend", data);
    return response.data;
};

export const logoutUser = async () => {
    try {
        const response = await api.post("/auth/logout");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        return response.data;
    } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
    }
};

export const getCurrentUser = async () => {
    const response = await api.get("/auth/me");
    return response.data;
};

export const forgetPassword = async (email) => {
    const response = await api.post("/auth/forget-password", { email });
    return response.data;
};

export const verifyOtp = async (data) => {
    const response = await api.post("/auth/forget-password/verify-otp", data);
    return response.data;
};

export const resetPasswordWithOtp = async (data) => {
    const response = await api.post("/auth/forget-password/reset", data);
    return response.data;
};

export const refreshTokenApi = async () => {
    const response = await api.post("/auth/refresh");
    if (response.data?.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
    }
    return response.data;
};
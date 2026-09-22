import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getCurrentUser, logoutUser } from "../api/auth.api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        try {
            return savedUser ? JSON.parse(savedUser) : null;
        } catch {
            return null;
        }
    });
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = !!user;
    const role = user?.role || user?.user_type || "user";

    useEffect(() => {
        const verifySession = async () => {
            const hasSessionHint = localStorage.getItem("user") || localStorage.getItem("accessToken");
            if (hasSessionHint) {
                try {
                    const data = await getCurrentUser();
                    if (data?.user) {
                        setUser(data.user);
                        localStorage.setItem("user", JSON.stringify(data.user));
                        sessionStorage.setItem("account", JSON.stringify({
                            name: data.user.name || '',
                            username: data.user.username || '',
                            role: data.user.role || data.user.user_type || 'user'
                        }));
                    } else {
                        setUser(null);
                        localStorage.removeItem("accessToken");
                        localStorage.removeItem("user");
                        sessionStorage.removeItem("accessToken");
                        sessionStorage.removeItem("refreshToken");
                        sessionStorage.removeItem("account");
                    }
                } catch {
                    setUser(null);
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("user");
                    sessionStorage.removeItem("accessToken");
                    sessionStorage.removeItem("refreshToken");
                    sessionStorage.removeItem("account");
                }
            } else {
                setUser(null);
            }
            setIsLoading(false);
        };
        verifySession();
    }, []);

    const loginState = (userData, accessToken) => {
        setUser(userData);
        if (accessToken) {
            localStorage.setItem("accessToken", accessToken);
            sessionStorage.setItem("accessToken", accessToken.startsWith("Bearer ") ? accessToken : `Bearer ${accessToken}`);
        }
        if (userData) {
            localStorage.setItem("user", JSON.stringify(userData));
            sessionStorage.setItem("account", JSON.stringify({
                name: userData.name || '',
                username: userData.username || '',
                role: userData.role || userData.user_type || 'user'
            }));
        }
    };

    const logout = async () => {
        try {
            await logoutUser();
        } finally {
            setUser(null);
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
            sessionStorage.removeItem("accessToken");
            sessionStorage.removeItem("refreshToken");
            sessionStorage.removeItem("account");
        }
    };

    /**
     * Checks if current logged in user has a specific permission
     */
    const hasPermission = useCallback((permissionKey) => {
        if (!user) return false;
        const userRole = user.role || user.user_type || 'user';
        if (userRole === 'admin') return true;
        if (userRole !== 'staff') return false;

        const perms = user.permissions || user.role_id?.permissions || [];
        if (perms.includes('*')) return true;
        return perms.includes(permissionKey);
    }, [user]);

    /**
     * Checks if current logged in user has ANY of the given permissions
     */
    const hasAnyPermission = useCallback((permissionKeys = []) => {
        if (!user) return false;
        const userRole = user.role || user.user_type || 'user';
        if (userRole === 'admin') return true;
        if (userRole !== 'staff') return false;

        const perms = user.permissions || user.role_id?.permissions || [];
        if (perms.includes('*')) return true;
        if (!Array.isArray(permissionKeys) || permissionKeys.length === 0) return true;
        return permissionKeys.some(key => perms.includes(key));
    }, [user]);

    return (
        <AuthContext.Provider
            value={{
                user,
                role,
                isAuthenticated,
                isLoading,
                loginState,
                logout,
                hasPermission,
                hasAnyPermission
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;

import Role from '../models/Role.js';

/**
 * Middleware to check if the authenticated user has a specific permission
 * Admin role automatically passes all permission checks.
 */
export const checkPermission = (permissionKey) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            // Admin always has all permissions
            if (req.user.role === 'admin') {
                return next();
            }

            // If staff, check their assigned role permissions
            if (req.user.role === 'staff') {
                if (!req.user.role_id) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied: No role assigned'
                    });
                }

                const role = await Role.findById(req.user.role_id);
                if (!role || !role.permissions || !role.permissions.includes(permissionKey)) {
                    return res.status(403).json({
                        success: false,
                        message: `Access denied: Permission '${permissionKey}' required`
                    });
                }

                return next();
            }

            return res.status(403).json({
                success: false,
                message: 'Access denied: Staff or Admin role required'
            });
        } catch (error) {
            console.error('Permission check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error verifying permissions',
                error: error.message
            });
        }
    };
};

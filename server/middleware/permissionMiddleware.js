import Role from '../models/Role.js';

/**
 * Middleware to check if the authenticated user has specific permission(s).
 * - Admin role always passes automatically.
 * - Staff role checks permissions against their assigned Role document in MongoDB.
 * - Supports single permission string: checkPermission('blogs_view')
 * - Supports multiple alternative permissions (OR): checkPermission(['blogs_view', 'blogs_create'])
 * - Supports any/all modes.
 */
export const checkPermission = (requiredPermissions) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required. Please login.'
                });
            }

            const userRole = req.user.role || req.user.user_type || 'user';

            // 1. Admin always has full access to everything
            if (userRole === 'admin') {
                return next();
            }

            // 2. Staff user permission verification
            if (userRole === 'staff') {
                if (!req.user.role_id) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied: No role assigned to your staff account. Contact administrator.'
                    });
                }

                let permissions = [];

                // If role_id is already populated with Role document
                if (req.user.role_id && Array.isArray(req.user.role_id.permissions)) {
                    permissions = req.user.role_id.permissions;
                } else {
                    const role = await Role.findById(req.user.role_id);
                    if (!role) {
                        return res.status(403).json({
                            success: false,
                            message: 'Access denied: Assigned role not found in system.'
                        });
                    }
                    permissions = role.permissions || [];
                }

                // Super Admin / wildcard permission
                if (permissions.includes('*')) {
                    return next();
                }

                const requiredList = Array.isArray(requiredPermissions)
                    ? requiredPermissions
                    : [requiredPermissions];

                // If any of the required permissions matches, allow access
                const hasMatch = requiredList.some(p => permissions.includes(p));

                if (!hasMatch) {
                    return res.status(403).json({
                        success: false,
                        message: `Access denied: You do not have required permission (${requiredList.join(' or ')}) to perform this action.`
                    });
                }

                return next();
            }

            // 3. Regular users attempting to access admin endpoints
            return res.status(403).json({
                success: false,
                message: 'Access denied: Staff or Admin privileges required.'
            });
        } catch (error) {
            console.error('Permission verification error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error verifying permissions',
                error: error.message
            });
        }
    };
};

export default checkPermission;

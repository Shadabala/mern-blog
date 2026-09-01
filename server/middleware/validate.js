/**
 * Express Middleware for validating requests using Zod schemas.
 * Supports both root-level request schemas ({ body, params, query })
 * and direct body schemas.
 * 
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 */
export const validate = (schema) => {
    return (req, res, next) => {
        try {
            // Determine if schema evaluates root request keys (body, params, query) or direct body
            const isRequestSchema = schema.shape && ('body' in schema.shape || 'params' in schema.shape || 'query' in schema.shape);

            const targetData = isRequestSchema
                ? { body: req.body || {}, params: req.params || {}, query: req.query || {} }
                : (req.body || {});

            const result = schema.safeParse(targetData);

            if (!result.success) {
                const issues = result.error?.issues || result.error?.errors || [];
                const errors = {};

                for (const issue of issues) {
                    const rawPath = issue.path.map(String);
                    // Filter out 'body', 'params', or 'query' prefixes if present
                    const filteredPath = isRequestSchema && ['body', 'params', 'query'].includes(rawPath[0])
                        ? rawPath.slice(1)
                        : rawPath;

                    const field = filteredPath.join('.') || 'general';
                    const message = issue.message;

                    if (!errors[field]) {
                        errors[field] = message;
                    }
                }

                const firstError = Object.values(errors)[0] || 'Validation failed';

                return res.status(422).json({
                    success: false,
                    message: firstError,
                    errors
                });
            }

            // Sync sanitized/parsed data back to request object
            if (result.data) {
                if (isRequestSchema) {
                    if (result.data.body) req.body = result.data.body;
                    if (result.data.params) req.params = result.data.params;
                    if (result.data.query) req.query = result.data.query;
                } else {
                    req.body = result.data;
                }
                req.validated = result.data;
            }

            next();
        } catch (err) {
            console.error('Validation error:', err);
            return res.status(500).json({
                success: false,
                message: 'Internal server validation error',
                error: err.message
            });
        }
    };
};



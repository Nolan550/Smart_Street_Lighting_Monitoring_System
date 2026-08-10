const jwt = require('jsonwebtoken');

// Checks that a valid token was sent. Attaches the decoded user info
// (user_id, role) to req.user so later code/middleware can use it.
//
// Usage on a route:  router.get('/something', requireAuth, someController)
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization; // expected format: "Bearer <token>"

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No authentication token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { user_id, role, iat, exp }
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Checks that the logged-in user's role is one of the allowed roles.
// Must be used AFTER requireAuth, since it depends on req.user existing.
//
// Usage on a route:
//   router.post('/zones', requireAuth, requireRole('Administrator'), createZone)
//   router.patch('/faults/:id/resolve', requireAuth, requireRole('Maintenance Engineer'), resolveFault)
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: `This action requires one of these roles: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
};

module.exports = {
    requireAuth,
    requireRole
};

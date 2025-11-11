// Helper to create endpoint wrappers for Vercel
// Vercel serves each /api/XXX.js file for /api/XXX and /api/XXX/*
// but only passes the part after /api/XXX in req.url
// We need to reconstruct the full path for Express routing

function createEndpointWrapper(basePath) {
    const app = require('./index');
    
    return (req, res) => {
        // Debug: log EVERYTHING
        console.log('=== WRAPPER DEBUG ===');
        console.log('basePath:', basePath);
        console.log('req.url (before):', req.url);
        console.log('req.method:', req.method);
        console.log('req.headers:', JSON.stringify(req.headers));
        
        // Reconstruir path completo
        const originalUrl = req.url;
        const fullPath = req.url === '/' ? basePath : basePath + req.url;
        req.url = fullPath;
        
        console.log('req.url (after):', req.url);
        console.log('====================');
        
        // Pasar a Express
        return app(req, res);
    };
}

module.exports = { createEndpointWrapper };

// Helper to create endpoint wrappers for Vercel
// Vercel serves each /api/XXX.js file for /api/XXX and /api/XXX/*
// but only passes the part after /api/XXX in req.url
// We need to reconstruct the full path for Express routing

function createEndpointWrapper(basePath) {
    const app = require('./index');
    
    return (req, res) => {
        // Reconstruir path completo
        const fullPath = req.url === '/' ? basePath : basePath + req.url;
        req.url = fullPath;
        
        console.log(`[${basePath}] Reconstructed URL: ${fullPath}`);
        
        // Pasar a Express
        return app(req, res);
    };
}

module.exports = { createEndpointWrapper };

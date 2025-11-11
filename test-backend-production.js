// ============================================
// TEST BACKEND EN PRODUCCIÓN
// ============================================
// URL: https://quetzale.netlify.app
// Fecha: 11 de noviembre de 2025

const API_URL = 'https://quetzale.netlify.app/api';

// Colores para consola
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

// Helper para hacer requests
async function testEndpoint(method, endpoint, body = null, token = null) {
    const url = `${API_URL}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        
        return {
            success: response.ok,
            status: response.status,
            data
        };
    } catch (error) {
        return {
            success: false,
            status: 0,
            error: error.message
        };
    }
}

// Tests
async function runTests() {
    console.log(`\n${colors.blue}========================================`);
    console.log('🧪 PRUEBAS DE BACKEND EN PRODUCCIÓN');
    console.log(`URL: ${API_URL}`);
    console.log(`========================================${colors.reset}\n`);

    let token = null;
    let userId = null;
    const testResults = [];

    // ============================================
    // 1. PRUEBA: Health Check / Servicios públicos
    // ============================================
    console.log(`${colors.yellow}📋 Test 1: GET /api/services (público)${colors.reset}`);
    const servicesTest = await testEndpoint('GET', '/services');
    if (servicesTest.success) {
        console.log(`${colors.green}✅ PASS - Servicios obtenidos: ${servicesTest.data.count || 0}${colors.reset}`);
        testResults.push({ test: 'GET /services', status: 'PASS' });
    } else {
        console.log(`${colors.red}❌ FAIL - Status: ${servicesTest.status}${colors.reset}`);
        console.log('Error:', servicesTest.data || servicesTest.error);
        testResults.push({ test: 'GET /services', status: 'FAIL' });
    }

    // ============================================
    // 2. PRUEBA: Registro de usuario
    // ============================================
    console.log(`\n${colors.yellow}📋 Test 2: POST /api/auth/register${colors.reset}`);
    const randomEmail = `test_${Date.now()}@quetzal.com`;
    const registerData = {
        email: randomEmail,
        password: 'Test123456',
        fullName: 'Usuario Test',
        phone: '+57 300 1234567',
        city: 'bogota',
        userType: 'both'
    };
    
    const registerTest = await testEndpoint('POST', '/auth/register', registerData);
    if (registerTest.success) {
        console.log(`${colors.green}✅ PASS - Usuario registrado${colors.reset}`);
        token = registerTest.data.token;
        userId = registerTest.data.user?.id;
        testResults.push({ test: 'POST /auth/register', status: 'PASS' });
    } else {
        console.log(`${colors.red}❌ FAIL - Status: ${registerTest.status}${colors.reset}`);
        console.log('Error:', registerTest.data || registerTest.error);
        testResults.push({ test: 'POST /auth/register', status: 'FAIL' });
    }

    // ============================================
    // 3. PRUEBA: Login
    // ============================================
    console.log(`\n${colors.yellow}📋 Test 3: POST /api/auth/login${colors.reset}`);
    const loginData = {
        email: randomEmail,
        password: 'Test123456'
    };
    
    const loginTest = await testEndpoint('POST', '/auth/login', loginData);
    if (loginTest.success) {
        console.log(`${colors.green}✅ PASS - Login exitoso${colors.reset}`);
        token = loginTest.data.token; // Actualizar token
        testResults.push({ test: 'POST /auth/login', status: 'PASS' });
    } else {
        console.log(`${colors.red}❌ FAIL - Status: ${loginTest.status}${colors.reset}`);
        console.log('Error:', loginTest.data || loginTest.error);
        testResults.push({ test: 'POST /auth/login', status: 'FAIL' });
    }

    // ============================================
    // 4. PRUEBA: Verificar token
    // ============================================
    console.log(`\n${colors.yellow}📋 Test 4: GET /api/auth/verify (con token)${colors.reset}`);
    const verifyTest = await testEndpoint('GET', '/auth/verify', null, token);
    if (verifyTest.success) {
        console.log(`${colors.green}✅ PASS - Token válido${colors.reset}`);
        testResults.push({ test: 'GET /auth/verify', status: 'PASS' });
    } else {
        console.log(`${colors.red}❌ FAIL - Status: ${verifyTest.status}${colors.reset}`);
        console.log('Error:', verifyTest.data || verifyTest.error);
        testResults.push({ test: 'GET /auth/verify', status: 'FAIL' });
    }

    // ============================================
    // 5. PRUEBA: Crear servicio
    // ============================================
    console.log(`\n${colors.yellow}📋 Test 5: POST /api/services (autenticado)${colors.reset}`);
    const serviceData = {
        title: 'Servicio de Prueba Backend',
        description: 'Este es un servicio de prueba para verificar el backend en producción. Incluye validaciones completas.',
        category: 'desarrollo',
        price: 25.5,
        deliveryTime: '7',
        requirements: 'Ninguno'
    };
    
    const createServiceTest = await testEndpoint('POST', '/services', serviceData, token);
    if (createServiceTest.success) {
        console.log(`${colors.green}✅ PASS - Servicio creado${colors.reset}`);
        testResults.push({ test: 'POST /services', status: 'PASS' });
    } else {
        console.log(`${colors.red}❌ FAIL - Status: ${createServiceTest.status}${colors.reset}`);
        console.log('Error:', createServiceTest.data || createServiceTest.error);
        testResults.push({ test: 'POST /services', status: 'FAIL' });
    }

    // ============================================
    // 6. PRUEBA: Obtener mis servicios
    // ============================================
    console.log(`\n${colors.yellow}📋 Test 6: GET /api/services/my-services (autenticado)${colors.reset}`);
    const myServicesTest = await testEndpoint('GET', '/services/my-services', null, token);
    if (myServicesTest.success) {
        console.log(`${colors.green}✅ PASS - Servicios obtenidos: ${myServicesTest.data.count || 0}${colors.reset}`);
        testResults.push({ test: 'GET /services/my-services', status: 'PASS' });
    } else {
        console.log(`${colors.red}❌ FAIL - Status: ${myServicesTest.status}${colors.reset}`);
        console.log('Error:', myServicesTest.data || myServicesTest.error);
        testResults.push({ test: 'GET /services/my-services', status: 'FAIL' });
    }

    // ============================================
    // 7. PRUEBA: Wallet balance
    // ============================================
    console.log(`\n${colors.yellow}📋 Test 7: GET /api/wallet/balance (autenticado)${colors.reset}`);
    const walletTest = await testEndpoint('GET', '/wallet/balance', null, token);
    if (walletTest.success) {
        console.log(`${colors.green}✅ PASS - Balance obtenido${colors.reset}`);
        testResults.push({ test: 'GET /wallet/balance', status: 'PASS' });
    } else {
        console.log(`${colors.red}❌ FAIL - Status: ${walletTest.status}${colors.reset}`);
        console.log('Error:', walletTest.data || walletTest.error);
        testResults.push({ test: 'GET /wallet/balance', status: 'FAIL' });
    }

    // ============================================
    // RESUMEN
    // ============================================
    console.log(`\n${colors.blue}========================================`);
    console.log('📊 RESUMEN DE PRUEBAS');
    console.log(`========================================${colors.reset}`);
    
    const passed = testResults.filter(r => r.status === 'PASS').length;
    const failed = testResults.filter(r => r.status === 'FAIL').length;
    const total = testResults.length;

    console.log(`\n✅ Pasadas: ${colors.green}${passed}/${total}${colors.reset}`);
    console.log(`❌ Fallidas: ${colors.red}${failed}/${total}${colors.reset}`);
    
    if (failed > 0) {
        console.log(`\n${colors.red}⚠️ Pruebas fallidas:${colors.reset}`);
        testResults.filter(r => r.status === 'FAIL').forEach(r => {
            console.log(`  - ${r.test}`);
        });
    }

    console.log(`\n${colors.blue}========================================${colors.reset}\n`);
}

// Ejecutar pruebas
runTests().catch(console.error);

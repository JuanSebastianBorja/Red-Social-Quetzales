// testEpayco.js
// Este script prueba la integración de ePayco Onpage sin necesidad del frontend.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') }); // Carga las variables de entorno desde el .env del backend

// Importa solo los módulos necesarios
// Ajusta la ruta para que apunte a src/models
const { Wallet, User, Transaction } = require('./src/models');
// Ajusta la ruta para que apunte a src/services/paymentService
const { createEpaycoTransaction } = require('./src/services/paymentService');

async function runTest() {
  console.log("🔍 Iniciando prueba de integración ePayco Onpage...");

  try {
    // 1. Seleccionar un usuario de prueba (debes conocer su ID o email)
    // OJO: CAMBIA ESTE VALOR POR EL ID DEL USUARIO QUE ACABAS DE CREAR
    const userIdToTest = 'b3322577-5ef1-40f7-8ae2-a470a61785bf'; // <-- ID del usuario 'Test User'

    console.log(`👤 Buscando usuario con ID: ${userIdToTest}`);
    // Asegúrate de que la asociación 'wallet' esté definida en el modelo User si usas 'include'
    // Si no, puedes buscar la wallet por separado después de obtener el usuario
    const user = await User.findByPk(userIdToTest); // { include: [{ model: Wallet, as: 'wallet' }] });

    if (!user) {
      throw new Error(`Usuario con ID ${userIdToTest} no encontrado.`);
    }

    // Buscar la wallet asociada al usuario
    const userWallet = await Wallet.findOne({ where: { userId: userIdToTest } });

    if (!userWallet) {
      throw new Error(`El usuario ${user.fullName} no tiene una wallet asociada.`);
    }

    console.log(`✅ Usuario encontrado: ${user.fullName} (${user.email})`);
    console.log(`💰 Wallet ID: ${userWallet.id}, Balance: ${userWallet.balance}`);

    // 2. Definir datos de prueba para la transacción
    const testData = {
      userId: user.id,
      amountCOP: 20000, // Por ejemplo, 20,000 COP = 2 QZ (ajusta según QZ_TO_COP)
      email: user.email, // Usar el email del usuario
      ipAddress: '127.0.0.1', // IP de prueba
      userAgent: 'Test Script' // User Agent de prueba
    };

    console.log("\n📦 Datos para crear transacción ePayco:", testData);

    // 3. Llamar a la función del servicio que maneja DB y API
    console.log("\n📤 Llamando a paymentService.createEpaycoTransaction...");
    const result = await createEpaycoTransaction(testData); // <-- Llama a la función exportada

    console.log("\n✅ Resultado de createEpaycoTransaction:");
    console.log(JSON.stringify(result, null, 2));

    // 4. Verificar que se haya creado la transacción en la DB
    // El campo en el modelo Transaction es 'paymentReference'
    const reference = result.reference; // El campo 'reference' en el resultado es 'paymentReference' en DB
    console.log(`\n🔍 Verificando transacción en la base de datos con reference: ${reference}`);
    const dbTransaction = await Transaction.findOne({
      where: { paymentReference: reference }, // <-- Usa 'paymentReference' como está en el modelo
      // Asegúrate de que 'wallet' sea el alias correcto de la asociación en el modelo Transaction
      include: [{ model: Wallet, as: 'wallet' }]
    });

    if (!dbTransaction) {
      throw new Error(`Transacción con reference ${reference} no encontrada en la base de datos después de la creación.`);
    }

    console.log("\n✅ Transacción encontrada en la DB:");
    console.log({
      id: dbTransaction.id,
      reference: dbTransaction.paymentReference, // <-- Nombre correcto del campo
      userId: dbTransaction.userId,              // <-- Nombre correcto del campo
      walletId: dbTransaction.walletId,         // <-- Nombre correcto del campo
      amountCOP: dbTransaction.amountCOP,       // <-- Nombre correcto del campo
      amountQZ: dbTransaction.amountQZ,         // <-- Nombre correcto del campo
      status: dbTransaction.status,             // <-- Nombre correcto del campo
      createdAt: dbTransaction.createdAt
    });

    if (dbTransaction.status !== 'pending') {
        console.warn(`⚠️ Advertencia: El estado de la transacción en DB es '${dbTransaction.status}', se esperaba 'pending'.`);
    } else {
        console.log("✅ Estado de la transacción en DB es 'pending' como se esperaba.");
    }

    // 5. (Opcional) Simular un webhook de ePayco para probar la confirmación
    // Esto lo harías manualmente o con una herramienta como Postman/envío directo a tu endpoint
    console.log("\n✅ Prueba inicial de creación de transacción ePayco Onpage completada con éxito.");
    console.log("   Puedes ahora simular un webhook de ePayco para probar la confirmación.");
    console.log("   Endpoint webhook: POST /api/wallet/epayco/confirmation");

  } catch (error) {
    console.error("\n❌ Error durante la prueba:", error.message);
    console.error(error.stack);
  }
}

// Ejecutar la prueba
runTest();
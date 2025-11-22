// simulateEpaycoWebhook.js
// Script para simular el webhook de ePayco y probar la lógica de confirmación del backend

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Importar modelos y servicios
const { Transaction, Wallet, User, sequelize } = require('./src/models');
const { processEpaycoConfirmation } = require('./src/services/paymentService');

/**
 * Simula la generación de la firma HMAC SHA256 de ePayco.
 * Esta función replica la lógica que ePayco usa para firmar la notificación.
 * @param {Object} body - El cuerpo de la solicitud del webhook.
 * @returns {string} - La firma generada.
 */
function simulateEpaycoSignature(body) { // <-- Nombre correcto
  const p_key = process.env.EPAYCO_P_KEY; // Tu llave P_KEY desde el .env

  const {
    x_ref_payco,
    x_transaction_id,
    x_amount,
    x_currency_code,
  } = body;

  if (!x_ref_payco || !x_transaction_id || !x_amount || !x_currency_code) {
    throw new Error("Faltan campos requeridos para generar la firma de prueba.");
  }

  const signatureString = `${x_ref_payco}~${x_transaction_id}~${x_amount}~${x_currency_code}`;
  const crypto = require("crypto"); // Importar crypto dentro de la función si no está en el scope global
  // CORREGIDO: Usar 'p_key', no 'p_key' (variable no definida)
  const expected = crypto.createHmac("sha256", p_key).update(signatureString).digest("hex"); // <-- ✅ p_key

  return expected;
}

/**
 * Simula un webhook de ePayco con un estado específico.
 * @param {string} reference - La referencia de la transacción en tu base de datos (paymentReference).
 * @param {string} transactionState - El estado de la transacción enviado por ePayco (APPROVED, FAILED, etc.).
 * @param {string} responseCode - El código de respuesta enviado por ePayco (1 para aprobado, 2 para rechazado, 3 para fallido).
 * @param {string} responseReasonText - Texto descriptivo del motivo (opcional).
 */
async function simulateWebhook(reference, transactionState, responseCode, responseReasonText = '') {
  console.log(`\n🧪 Simulando webhook para la transacción: ${reference}`);
  console.log(`   Estado: ${transactionState}, Código: ${responseCode}`);

  try {
    // 1. Buscar la transacción en la base de datos para obtener datos necesarios (como el walletId y el monto original)
    const transaction = await Transaction.findOne({
      where: { paymentReference: reference },
      include: [
        {
          model: Wallet,
          as: 'wallet', // Asumiendo que tu modelo Transaction tiene la asociación 'wallet'
          include: [
            {
              model: User,
              as: 'user' // Asumiendo que Wallet tiene la asociación 'user'
            }
          ]
        }
      ]
    });

    if (!transaction) {
      console.error(`❌ Transacción con reference ${reference} no encontrada en la base de datos.`);
      return;
    }

    console.log(`   - Usuario: ${transaction.wallet.user.fullName} (${transaction.wallet.user.email})`);
    console.log(`   - Monto COP: ${transaction.amountCOP}, Monto QZ: ${transaction.amountQZ}`);
    console.log(`   - Estado actual en DB: ${transaction.status}`);
    console.log(`   - Wallet ID: ${transaction.walletId}`);
    console.log(`   - Balance de la wallet antes del webhook: ${transaction.wallet.balance}`);

    // 2. Crear un objeto req.body simulado con los datos que ePayco enviaría
    const fakeWebhookBody = {
      x_signature: "", // Se calculará abajo
      x_ref_payco: reference, // La referencia que generaste al crear la transacción
      x_transaction_id: `txn_${Math.random().toString(36).substr(2, 9)}`, // ID de transacción ficticio de ePayco
      x_transaction_state: transactionState, // El estado que quieres simular
      x_response_code: responseCode, // El código de respuesta que quieres simular
      // CORREGIDO: Convertir a número antes de toFixed
      x_amount: parseFloat(transaction.amountCOP).toFixed(2), // El monto enviado por ePayco (debería coincidir)
      x_currency_code: 'COP', // Moneda
      x_response_reason_text: responseReasonText, // Motivo si aplica
      x_approval_code: responseCode === '1' ? 'APPR_CODE_123' : null, // Código de aprobación si es exitoso
      // Otros campos que ePayco podría enviar...
    };

    // 3. Simular la firma HMAC que ePayco pondría en x_signature
    // CORREGIDO: Llamar a la función con el nombre correcto
    fakeWebhookBody.x_signature = simulateEpaycoSignature(fakeWebhookBody); // <-- ✅ simulateEpaycoSignature

    console.log(`   - Cuerpo del webhook simulado:`, fakeWebhookBody);

    // 4. Crear un objeto req simulado
    const fakeReq = {
      body: fakeWebhookBody,
      // headers: {} // Si tu validación de firma también revisa headers, agrégalos aquí
    };

    // 5. Llamar directamente a la función del servicio que maneja el webhook
    const result = await processEpaycoConfirmation(fakeReq);

    console.log(`   - Resultado del webhook:`, result);

    // 6. Volver a leer la transacción y la wallet para ver los cambios
    const updatedTransaction = await Transaction.findByPk(transaction.id, {
      include: [{ model: Wallet, as: 'wallet', include: [{ model: User, as: 'user' }] }]
    });

    console.log(`   - Estado de la transacción después del webhook: ${updatedTransaction.status}`);
    console.log(`   - Balance de la wallet después del webhook: ${updatedTransaction.wallet.balance}`);

    if (updatedTransaction.status === 'approved') {
      console.log(`   💰 ¡Saldo acreditado correctamente!`);
    } else if (['rejected', 'failed'].includes(updatedTransaction.status)) {
      console.log(`   ❌ Pago rechazado o fallido. Estado actualizado.`);
    } else {
      console.log(`   ⏳ Estado actualizado a: ${updatedTransaction.status}`);
    }

  } catch (error) {
    console.error(`❌ Error simulando webhook para ${reference}:`, error);
  }
}

// Función principal para ejecutar la simulación
async function runSimulation() {
  console.log("🚀 Iniciando simulación de webhook de ePayco...");

  // --- PARÁMETROS DE PRUEBA ---
  // Cambia esta referencia por una real que hayas creado con testEpayco.js o manualmente
  const transactionReference = 'QZ-1763765930643-8D01AD41'; // <-- COLOCA LA REFERENCIA REAL AQUÍ

  // --- Simular PAGO APROBADO ---
  await simulateWebhook(transactionReference, 'APPROVED', '1', 'Transacción aprobada exitosamente');

  // Opcional: Simular otro estado (por ejemplo, rechazado)
  // await simulateWebhook(transactionReference, 'FAILED', '3', 'Fondos insuficientes');
  // await simulateWebhook(transactionReference, 'PENDING', '1', 'Pago pendiente de confirmación'); // Caso límite

  console.log("\n✅ Simulación completada.");
}

// Ejecutar la simulación
runSimulation().catch(console.error);
// ============================================
// PAYMENT SERVICE - ePayco Checkout Onpage (VERSIÓN FINAL - Con llamada API)
// ============================================

const crypto = require("crypto");
const { Transaction: SequelizeTransaction } = require("sequelize");
const { Transaction, Wallet } = require("../models");
const { sequelize } = require("../config/database");
const { QZ_TO_COP, copToQZ } = require("../utils/currency");
const ePayco = require('epayco-sdk-node');

// Inicializar el SDK con las credenciales desde las variables de entorno
const epayco = new ePayco({
  apiKey: process.env.EPAYCO_PUBLIC_KEY,
  privateKey: process.env.EPAYCO_PRIVATE_KEY,
  lang: "ES", // Idioma
  test: process.env.EPAYCO_TEST === 'true' || process.env.EPAYCO_TEST === '1' // Booleano para sandbox
});

// ============================================
// Utilidades internas
// ============================================

// Generar referencia única para la transacción
function generatePaymentReference() {
  return (
    "QZ-" +
    Date.now() +
    "-" +
    crypto.randomBytes(4).toString("hex").toUpperCase()
  );
}

// Mapea estado ePayco → estado interno
function mapEpaycoState(state, responseCode) {
  const s = String(state || "").toUpperCase();

  if (s === "APPROVED" && String(responseCode) === "1") return "approved";
  if (["DECLINED", "REJECTED"].includes(s)) return "rejected";
  if (s === "FAILED") return "failed";
  if (s === "PENDING") return "processing";

  return "cancelled";
}

// ============================================
// 1. CREAR REGISTRO DE TRANSACCIÓN EN LA BASE DE DATOS (Antes llamada createTransaction)
// ============================================
async function createTransactionRecord({ userId, amountCOP, email, ipAddress, userAgent, paymentReference }) {
  try {
    if (!userId || !amountCOP || !paymentReference) {
      throw new Error("Faltan parámetros obligatorios para crear el registro");
    }

    const userWallet = await Wallet.findOne({ where: { userId } });
    if (!userWallet) throw new Error("Wallet del usuario no encontrada");

    const amountQZ = copToQZ(amountCOP);

    const transaction = await Transaction.create({
      userId,
      walletId: userWallet.id,
      type: "topup",
      paymentMethod: "epayco",
      status: "pending",

      amount: parseFloat(amountQZ.toFixed(2)),
      amountCOP: parseFloat(amountCOP),
      amountQZ: parseFloat(amountQZ.toFixed(2)),
      exchangeRate: parseFloat(QZ_TO_COP),

      paymentReference, // Usar la referencia ya generada
      description: `Recarga de ${amountQZ.toFixed(2)} QZ vía ePayco`,

      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos de expiración

      metadata: {
        email,
        internal_reference: paymentReference,
      },
    });

    return transaction; // Devolver el objeto de transacción recién creado
  } catch (err) {
    console.error("❌ Error creando registro de transacción en DB:", err);
    throw err;
  }
}

// ============================================
// 2. CREAR TRANSACCIÓN ePayco Y REGISTRO EN DB (Para Onpage Checkout)
// ============================================
async function createEpaycoTransaction({ userId, amountCOP, email, ipAddress, userAgent }) {
  try {
    if (!userId || !amountCOP) {
      throw new Error("Faltan parámetros obligatorios");
    }

    const paymentReference = generatePaymentReference();

    // 1. Crear el registro en la base de datos primero
    const transactionRecord = await createTransactionRecord({ userId, amountCOP, email, ipAddress, userAgent, paymentReference });

    // 2. Preparar datos para que el frontend inicialice Onpage Checkout
    // Estos son los datos que se enviarán al frontend para que configure ePayco.checkout
    const frontendCheckoutData = {
      // Datos del producto/servicio
      name: "Recarga de Quetzales", // Nombre del producto
      description: `Recarga de Quetzales - ${email}`, // Descripción
      invoice: paymentReference, // Tu referencia interna (debe ser única)
      currency: 'COP', // Moneda
      amount: parseFloat(amountCOP).toFixed(2), // Monto en COP
      tax_base: '0', // Base imponible (si aplica, sino 0)
      tax: '0', // Impuesto (si aplica, sino 0)
      // Configuración de ePayco
      external: 'false', // Importante para Onpage Checkout
      key: process.env.EPAYCO_PUBLIC_KEY, // La clave pública de ePayco (debe ser accesible desde el frontend)
      test: process.env.EPAYCO_TEST === 'true' || process.env.EPAYCO_TEST === '1', // Modo sandbox o producción
      // URLs (deben ser accesibles desde el navegador del cliente)
      response: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/views/pse-callback.html?ref=${paymentReference}`,// URL a la que vuelve el usuario 
      confirmation: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/wallet/epayco/confirmation`, // URL de notificación (webhook) - ¡ESTA DEBE SER ACCESIBLE DESDE ePayco!
      // Datos del cliente (opcional pero recomendado)
      customer_doctype: 'CC', // Tipo de documento (opcional, asumiendo CC)
      customer_document: '123456789', // Número de documento (opcional, usar uno genérico o pedirlo al usuario)
      customer_name: email.split('@')[0] || 'Cliente', // Nombre del cliente
      customer_lastname: 'N/A', // Apellido del cliente (opcional)
      customer_email: email, // Email del cliente
      customer_phone: 'N/A', // Teléfono (opcional)
      customer_addr: 'N/A', // Dirección (opcional)
      customer_city: 'N/A', // Ciudad (opcional)
      customer_country: 'CO', // País (opcional)
      customer_ip: ipAddress, // IP del cliente (opcional pero recomendado para seguridad)
      // Otros campos opcionales...
    };

    // 3. Devolver los datos necesarios para que el frontend inicialice Onpage
    return {
      success: true,
      reference: transactionRecord.paymentReference, // Tu referencia interna
      amountCOP: parseFloat(amountCOP),
      amountQZ: parseFloat(parseFloat(transactionRecord.amount).toFixed(2)),
      // Datos específicos para que el frontend inicialice ePayco Onpage
      epaycoData: frontendCheckoutData, // <-- Envolver todos los datos de checkout aquí
    };

  } catch (err) {
    console.error("❌ Error creando transacción en ePayco (Onpage):", err);
    // Si la API de ePayco falla, la transacción en DB probablemente aún exista como 'pending'.
    // Dejar la transacción como 'pending' y propagar el error para que el controlador lo maneje.
    throw err;
  }
}


// ============================================
// 3. Validar firma ePayco (solo SHA256 estándar) - 
// ============================================
function isValidEpaycoSignature(body) {
  try {
    const {
      x_signature,
      x_ref_payco,
      x_transaction_id,
      x_amount,
      x_currency_code,
    } = body;

    if (!x_signature || !x_ref_payco || !x_transaction_id || !x_amount || !x_currency_code) {
      return false;
    }

    const p_key = process.env.EPAYCO_P_KEY;
    const signatureString = `${x_ref_payco}~${x_transaction_id}~${x_amount}~${x_currency_code}`;
    const expected = crypto.createHmac("sha256", p_key).update(signatureString).digest("hex");

    return expected.toLowerCase() === String(x_signature).toLowerCase();
  } catch (err) {
    console.error("❌ Error validando firma:", err);
    return false;
  }
}

// ============================================
// 4. PROCESAR WEBHOOK DE EPAYCO - 
// ============================================
async function processEpaycoConfirmation(req) {
  const body = req.body || {};

  console.log("=== Webhook ePayco recibido ===");
  console.log(JSON.stringify(body, null, 2));

  try {
    if (!isValidEpaycoSignature(body)) {
      console.error("❌ Firma de ePayco inválida");
      return { success: false, message: "Invalid signature" };
    }

    const {
      x_ref_payco,
      x_id_invoice,
      x_transaction_state,
      x_transaction_id,
      x_currency_code,
      x_amount,
      x_response_code,
      x_response_reason_text,
      x_approval_code,
    } = body;

    // ePayco a veces envía x_id_invoice en lugar de x_ref_payco
    const reference = x_ref_payco || x_id_invoice;

    if (!reference) {
      console.error("❌ Webhook sin referencia válida");
      return { success: false, message: "Missing reference" };
    }

    return await sequelize.transaction(async (tx) => {
      const transactionRecord = await Transaction.findOne({
        where: { paymentReference: reference },
        lock: SequelizeTransaction.LOCK.UPDATE,
        transaction: tx,
      });

      if (!transactionRecord) {
        console.error("❌ Transacción no encontrada:", reference);
        return { success: false, message: "Transaction not found" };
      }

      // Idempotencia máxima
      const finalStates = ["approved", "rejected", "failed", "cancelled", "completed"];
      if (finalStates.includes(transactionRecord.status)) {
        console.log("ℹ Ya procesada →", transactionRecord.status);
        return { success: true, message: "Already processed" };
      }

      const newStatus = mapEpaycoState(x_transaction_state, x_response_code);
      let approvedAt = newStatus === "approved" ? new Date() : null;

      // Acreditar solo si está aprobado
      if (newStatus === "approved") {
        const wallet = await Wallet.findByPk(transactionRecord.walletId, {
          lock: SequelizeTransaction.LOCK.UPDATE,
          transaction: tx,
        });

        if (wallet) {
          const prev = parseFloat(wallet.balance);
          const add = parseFloat(transactionRecord.amount);
          const newBalance = parseFloat((prev + add).toFixed(2));

          await wallet.update({ balance: newBalance }, { transaction: tx });
          console.log(`💰 Saldo acreditado: ${prev} → ${newBalance}`);
        }
      }

      await transactionRecord.update(
        {
          status: newStatus,
          authorizationCode: x_approval_code || null,
          approvedAt,
          errorMessage: x_response_reason_text || null,
          metadata: {
            ...(transactionRecord.metadata || {}),
            epayco: {
              ref_payco: reference,
              transaction_id: x_transaction_id,
              currency: x_currency_code,
              amount: x_amount,
              state: x_transaction_state,
              raw: body,
            },
          },
        },
        { transaction: tx }
      );

      console.log("✔ Transacción actualizada:", reference, "→", newStatus);
      return { success: true };
    });
  } catch (err) {
    console.error("❌ Error en webhook ePayco:", err);
    return { success: false, message: "Internal error" };
  }
}

// ============================================
// 5. CONSULTAR ESTADO DE UNA TRANSACCIÓN - 
// ============================================
async function getTransactionStatus(reference) {
  const transaction = await Transaction.findOne({
    where: { paymentReference: reference },
  });

  if (!transaction) {
    return { success: false, message: "Transacción no encontrada" };
  }

  return { success: true, transaction };
}

// ============================================
// 6. EXPIRAR TRANSACCIONES -
// ============================================
async function expireOldTransactions() {
  const { Op } = require("sequelize");

  const [count] = await Transaction.update(
    { status: "cancelled" },
    {
      where: {
        status: { [Op.in]: ["pending", "processing"] },
        expiresAt: { [Op.lt]: new Date() },
      },
    }
  );

  return count;
}

// ============================================
// EXPORTS - 
// ============================================
module.exports = {
  createEpaycoTransaction, // <-- Exportar la nueva función principal
  // createTransaction: createEpaycoTransaction, // <-- Opcional: si quieres mantener el nombre anterior apuntando a la nueva función
  processEpaycoConfirmation,
  getTransactionStatus,
  expireOldTransactions,
  // Opcional: Exportar la función interna si otros servicios la necesitan
  // createTransactionRecord,
};

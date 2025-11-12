// ============================================
// PAYMENT SERVICE - Integración PSE
// ============================================
// Servicio para gestionar pagos mediante PSE (Pagos Seguros en Línea)
// Nota: Esta es una implementación de ejemplo. En producción debes usar
// la API real de tu proveedor PSE (ej: ePayco, PayU, PlacetoPay)

const crypto = require('crypto');
const { Transaction, User } = require('../models');
const { QZ_TO_FIAT } = require('../models');

// ============================================
// CONFIGURACIÓN PSE
// ============================================
const PSE_CONFIG = {
  // En producción, usar variables de entorno
  merchantId: process.env.PSE_MERCHANT_ID || 'QUETZAL_MERCHANT',
  apiKey: process.env.PSE_API_KEY || 'test_api_key_12345',
  secretKey: process.env.PSE_SECRET_KEY || 'test_secret_key_67890',
  apiUrl: process.env.PSE_API_URL || 'https://sandbox.api.pse.com',
  returnUrl: process.env.PSE_RETURN_URL || 'http://localhost:3000/views/pse-callback.html',
  environment: process.env.PSE_ENVIRONMENT || 'sandbox' // sandbox o production
};

// ============================================
// LISTA DE BANCOS PSE (COLOMBIA)
// ============================================
const PSE_BANKS = [
  { code: '1007', name: 'BANCOLOMBIA' },
  { code: '1013', name: 'BBVA COLOMBIA' },
  { code: '1009', name: 'CITIBANK' },
  { code: '1040', name: 'BANCO AGRARIO' },
  { code: '1052', name: 'BANCO AV VILLAS' },
  { code: '1001', name: 'BANCO DE BOGOTA' },
  { code: '1023', name: 'BANCO DE OCCIDENTE' },
  { code: '1062', name: 'BANCO FALABELLA' },
  { code: '1012', name: 'BANCO GNB SUDAMERIS' },
  { code: '1006', name: 'BANCO ITAU' },
  { code: '1060', name: 'BANCO PICHINCHA' },
  { code: '1002', name: 'BANCO POPULAR' },
  { code: '1058', name: 'BANCO PROCREDIT' },
  { code: '1065', name: 'BANCO SANTANDER' },
  { code: '1066', name: 'BANCO SERFINANZA' },
  { code: '1051', name: 'DAVIVIENDA' },
  { code: '1507', name: 'NEQUI' },
  { code: '1551', name: 'DAVIPLATA' },
  { code: '1283', name: 'CFA COOPERATIVA FINANCIERA' },
  { code: '1289', name: 'COTRAFA' },
  { code: '1370', name: 'COLTEFINANCIERA' },
  { code: '1292', name: 'CONFIAR' }
];

// ============================================
// OBTENER LISTA DE BANCOS
// ============================================
async function getBanks() {
  // En producción, esto debería hacer una petición a la API de PSE
  // para obtener la lista actualizada de bancos
  return PSE_BANKS;
}

// ============================================
// CREAR TRANSACCIÓN PSE
// ============================================
async function createPseTransaction({
  userId,
  amountCOP,
  bankCode,
  personType = 'natural',
  documentType = 'CC',
  documentNumber,
  email,
  ipAddress,
  userAgent
}) {
  try {
    // 1. Calcular Quetzales
    const amountQZ = parseFloat(amountCOP) / QZ_TO_FIAT;

    // 2. Generar referencia única
    const paymentReference = `QZ-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // 3. Buscar información del banco
    const bank = PSE_BANKS.find(b => b.code === bankCode);
    const bankName = bank ? bank.name : 'BANCO DESCONOCIDO';

    // 4. Crear registro en BD con estado 'pending'
    const transaction = await Transaction.create({
      userId,
      type: 'topup',
      paymentMethod: 'pse',
      status: 'pending',
      amountCOP: parseFloat(amountCOP),
      amountQZ: parseFloat(amountQZ.toFixed(2)),
      exchangeRate: QZ_TO_FIAT,
      bankCode,
      bankName,
      personType,
      documentType,
      documentNumber,
      paymentReference,
      description: `Recarga de ${amountQZ.toFixed(2)} Quetzales vía PSE - ${bankName}`,
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
      metadata: {
        email,
        merchantId: PSE_CONFIG.merchantId
      }
    });

    // 5. Simular llamada a API de PSE
    // En producción, aquí harías una petición HTTP a la API real de PSE
    const pseResponse = await mockPseApiCall({
      reference: paymentReference,
      amount: amountCOP,
      bankCode,
      personType,
      documentType,
      documentNumber,
      email,
      returnUrl: `${PSE_CONFIG.returnUrl}?reference=${paymentReference}`
    });

    // 6. Actualizar transacción con datos de PSE
    await transaction.update({
      pseTransactionId: pseResponse.transactionId,
      bankUrl: pseResponse.bankUrl,
      status: 'processing'
    });

    // 7. Retornar datos para redirección
    return {
      success: true,
      transaction: {
        id: transaction.id,
        reference: paymentReference,
        pseTransactionId: pseResponse.transactionId,
        bankUrl: pseResponse.bankUrl,
        amountCOP: parseFloat(amountCOP),
        amountQZ: parseFloat(amountQZ.toFixed(2)),
        bankName,
        expiresAt: transaction.expiresAt
      }
    };

  } catch (error) {
    console.error('Error creando transacción PSE:', error);
    throw new Error(`Error al procesar el pago: ${error.message}`);
  }
}

// ============================================
// MOCK DE API PSE (SOLO PARA DESARROLLO)
// ============================================
// En producción, esto se reemplaza con llamadas reales a la API
async function mockPseApiCall(data) {
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Generar ID de transacción ficticio
  const transactionId = `PSE-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

  // Generar URL del banco simulado (en desarrollo)
  // En producción, PSE retorna la URL real del banco
  const isLocalDev = process.env.NODE_ENV !== 'production';
  const bankUrl = isLocalDev 
    ? `http://localhost:3000/views/pse-bank-simulator.html?tid=${transactionId}&ref=${data.reference}`
    : `${PSE_CONFIG.apiUrl}/payment?tid=${transactionId}&ref=${data.reference}`;

  return {
    transactionId,
    bankUrl,
    status: 'PENDING'
  };
}

// ============================================
// PROCESAR CALLBACK DE PSE
// ============================================
async function processPseCallback(reference, status, authorizationCode = null) {
  try {
    // 1. Buscar transacción por referencia
    const transaction = await Transaction.findOne({
      where: { paymentReference: reference },
      include: [{ model: User, as: 'user' }]
    });

    if (!transaction) {
      throw new Error('Transacción no encontrada');
    }

    // 2. Verificar que no esté ya procesada
    if (['approved', 'rejected'].includes(transaction.status)) {
      return {
        success: false,
        message: 'Transacción ya procesada',
        status: transaction.status
      };
    }

    // 3. Actualizar según el estado recibido
    const now = new Date();
    let updateData = {
      authorizationCode
    };

    if (status === 'APPROVED' || status === 'approved') {
      updateData.status = 'approved';
      updateData.approvedAt = now;

      // 4. Acreditar Quetzales a la cuenta del usuario
      const { sequelize, WalletTx } = require('../models');
      
      await sequelize.transaction(async (t) => {
        // Actualizar balance del usuario
        const user = await User.findByPk(transaction.userId, {
          transaction: t,
          lock: t.LOCK.UPDATE
        });

        const newBalance = parseFloat(user.qzBalance) + parseFloat(transaction.amountQZ);
        await user.update({ qzBalance: newBalance.toFixed(2) }, { transaction: t });

        // Registrar en historial de wallet
        await WalletTx.create({
          userId: user.id,
          amountQz: parseFloat(transaction.amountQZ),
          kind: 'credit',
          category: 'topup',
          description: `Recarga PSE aprobada - ${transaction.bankName} (Ref: ${reference})`
        }, { transaction: t });

        // Actualizar transacción
        await transaction.update(updateData, { transaction: t });
      });

      return {
        success: true,
        message: 'Pago aprobado y Quetzales acreditados',
        transaction: {
          id: transaction.id,
          status: 'approved',
          amountQZ: parseFloat(transaction.amountQZ),
          reference
        }
      };

    } else if (status === 'REJECTED' || status === 'rejected' || status === 'FAILED') {
      updateData.status = 'rejected';
      updateData.errorMessage = 'Pago rechazado por el banco';

      await transaction.update(updateData);

      return {
        success: false,
        message: 'Pago rechazado',
        transaction: {
          id: transaction.id,
          status: 'rejected',
          reference
        }
      };

    } else {
      // Estado pendiente o en proceso
      updateData.status = 'processing';
      await transaction.update(updateData);

      return {
        success: false,
        message: 'Pago en proceso',
        transaction: {
          id: transaction.id,
          status: 'processing',
          reference
        }
      };
    }

  } catch (error) {
    console.error('Error procesando callback PSE:', error);
    throw error;
  }
}

// ============================================
// VERIFICAR ESTADO DE TRANSACCIÓN
// ============================================
async function getTransactionStatus(reference) {
  try {
    const transaction = await Transaction.findOne({
      where: { paymentReference: reference },
      attributes: [
        'id', 'status', 'amountCOP', 'amountQZ', 'bankName',
        'paymentReference', 'pseTransactionId', 'authorizationCode',
        'createdAt', 'approvedAt', 'expiresAt', 'errorMessage'
      ]
    });

    if (!transaction) {
      return {
        success: false,
        message: 'Transacción no encontrada'
      };
    }

    return {
      success: true,
      transaction: {
        id: transaction.id,
        reference: transaction.paymentReference,
        status: transaction.status,
        amountCOP: parseFloat(transaction.amountCOP),
        amountQZ: parseFloat(transaction.amountQZ),
        bankName: transaction.bankName,
        pseTransactionId: transaction.pseTransactionId,
        authorizationCode: transaction.authorizationCode,
        createdAt: transaction.createdAt,
        approvedAt: transaction.approvedAt,
        expiresAt: transaction.expiresAt,
        errorMessage: transaction.errorMessage
      }
    };

  } catch (error) {
    console.error('Error verificando estado de transacción:', error);
    throw error;
  }
}

// ============================================
// MARCAR TRANSACCIONES EXPIRADAS
// ============================================
async function expireOldTransactions() {
  try {
    const { Op } = require('sequelize');
    const result = await Transaction.update(
      { status: 'expired' },
      {
        where: {
          status: ['pending', 'processing'],
          expiresAt: {
            [Op.lt]: new Date()
          }
        }
      }
    );

    return result[0]; // Número de transacciones actualizadas
  } catch (error) {
    console.error('Error marcando transacciones expiradas:', error);
    return 0;
  }
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  getBanks,
  createPseTransaction,
  processPseCallback,
  getTransactionStatus,
  expireOldTransactions,
  PSE_CONFIG
};

// ============================================
// CONTRACT CONTROLLER - Contratación de Servicios
// ============================================

const { sequelize, Contract, Service, User, EscrowAccount, Conversation, WalletTx, QZ_TO_FIAT } = require('../models');
const { body, validationResult } = require('express-validator');
const escrowService = require('../services/escrowService');

// ============================================
// VALIDADORES
// ============================================

const createContractValidators = [
  body('serviceId').isInt().withMessage('ID de servicio inválido'),
  body('requirements').optional().isString().withMessage('Requisitos deben ser texto'),
  body('customDeliveryDays').optional().isInt({ min: 1 }).withMessage('Días de entrega inválidos')
];

const updateStatusValidators = [
  body('status').isIn(['in_progress', 'delivered', 'completed', 'cancelled', 'disputed'])
    .withMessage('Estado inválido'),
  body('reason').optional().isString()
];

// ============================================
// CREAR CONTRATO
// ============================================

async function createContract(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { serviceId, requirements, customDeliveryDays, attachments } = req.body;
    const buyerId = req.userId;

    // 1. Obtener información del servicio
    const service = await Service.findByPk(serviceId, {
      include: [{
        model: User,
        as: 'provider',
        attributes: ['id', 'fullName', 'email']
      }]
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    // 2. Verificar que el comprador no sea el mismo vendedor
    if (service.userId === buyerId) {
      return res.status(400).json({
        success: false,
        message: 'No puedes contratar tu propio servicio'
      });
    }

    // 3. Verificar que el comprador tenga fondos suficientes
    const buyer = await User.findByPk(buyerId);
    const servicePrice = parseFloat(service.price);
    const platformFee = parseFloat((servicePrice * 0.10).toFixed(2)); // 10% comisión
    const totalAmount = parseFloat((servicePrice + platformFee).toFixed(2));

    if (parseFloat(buyer.qzBalance) < totalAmount) {
      return res.status(400).json({
        success: false,
        message: `Fondos insuficientes. Necesitas ${totalAmount} Quetzales (Servicio: ${servicePrice} + Comisión: ${platformFee})`,
        required: totalAmount,
        available: parseFloat(buyer.qzBalance)
      });
    }

    // 4. Generar número de contrato único
    const contractNumber = `CTR-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    // 5. Calcular fecha límite de entrega
    const deliveryDays = customDeliveryDays || service.deliveryTime || 7;
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + deliveryDays);

    // 6. Crear contrato y escrow en una transacción
    const contract = await sequelize.transaction(async (t) => {
      // Crear escrow
      const escrow = await EscrowAccount.create({
        serviceId: service.id,
        buyerId: buyerId,
        sellerId: service.userId,
        amount: servicePrice,
        status: 'created',
        releaseCondition: 'buyer_approval'
      }, { transaction: t });

      // Crear contrato
      const newContract = await Contract.create({
        contractNumber,
        serviceId: service.id,
        buyerId: buyerId,
        sellerId: service.userId,
        escrowId: escrow.id,
        status: 'pending',
        title: service.title,
        description: service.description,
        requirements: requirements || '',
        servicePrice,
        platformFee,
        totalAmount,
        deliveryDays,
        deadline,
        attachments: attachments || [],
        maxRevisions: service.revisions || 2,
        metadata: {
          servicePriceAtCreation: servicePrice,
          serviceCategory: service.category
        }
      }, { transaction: t });

      // Debitar del comprador
      const newBuyerBalance = parseFloat(buyer.qzBalance) - totalAmount;
      await buyer.update({ qzBalance: newBuyerBalance.toFixed(2) }, { transaction: t });

      // Registrar transacción en wallet
      await WalletTx.create({
        userId: buyerId,
        amountQz: totalAmount,
        kind: 'debit',
        category: 'contract',
        description: `Contrato ${contractNumber} - ${service.title}`
      }, { transaction: t });

      // Fondear escrow
      await escrow.update({
        status: 'funded',
        fundedAt: new Date()
      }, { transaction: t });

      // Actualizar estado del contrato a 'paid'
      await newContract.update({ status: 'paid' }, { transaction: t });

      return newContract;
    });

    // 7. Retornar contrato creado
    const contractWithDetails = await Contract.findByPk(contract.id, {
      include: [
        { model: Service, as: 'service', attributes: ['id', 'title', 'category', 'imageUrl'] },
        { model: User, as: 'buyer', attributes: ['id', 'fullName', 'email', 'avatar'] },
        { model: User, as: 'seller', attributes: ['id', 'fullName', 'email', 'avatar'] },
        { model: EscrowAccount, as: 'escrow', attributes: ['id', 'amount', 'status'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Contrato creado y pago procesado exitosamente',
      contract: contractWithDetails
    });

  } catch (error) {
    console.error('Error creando contrato:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear contrato',
      error: error.message
    });
  }
}

// ============================================
// OBTENER CONTRATO POR ID
// ============================================

async function getContract(req, res) {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const contract = await Contract.findByPk(id, {
      include: [
        { model: Service, as: 'service' },
        { model: User, as: 'buyer', attributes: ['id', 'fullName', 'email', 'avatar', 'userType'] },
        { model: User, as: 'seller', attributes: ['id', 'fullName', 'email', 'avatar', 'userType'] },
        { model: EscrowAccount, as: 'escrow' },
        { model: Conversation, as: 'conversation' }
      ]
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato no encontrado'
      });
    }

    // Verificar que el usuario tenga permiso para ver el contrato
    if (contract.buyerId !== userId && contract.sellerId !== userId && !req.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este contrato'
      });
    }

    res.json({
      success: true,
      contract
    });

  } catch (error) {
    console.error('Error obteniendo contrato:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener contrato',
      error: error.message
    });
  }
}

// ============================================
// ACTUALIZAR ESTADO DEL CONTRATO
// ============================================

async function updateContractStatus(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status, reason, deliveryFiles } = req.body;
    const userId = req.userId;

    const contract = await Contract.findByPk(id, {
      include: [
        { model: EscrowAccount, as: 'escrow' },
        { model: User, as: 'buyer' },
        { model: User, as: 'seller' }
      ]
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato no encontrado'
      });
    }

    // Verificar permisos según la acción
    const isBuyer = contract.buyerId === userId;
    const isSeller = contract.sellerId === userId;

    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para modificar este contrato'
      });
    }

    // Validar transiciones de estado
    await sequelize.transaction(async (t) => {
      const now = new Date();

      switch (status) {
        case 'in_progress':
          if (contract.status !== 'paid') {
            throw new Error('Solo se puede iniciar si está en estado "paid"');
          }
          if (!isSeller) {
            throw new Error('Solo el vendedor puede iniciar el trabajo');
          }
          await contract.update({
            status: 'in_progress',
            startedAt: now
          }, { transaction: t });
          break;

        case 'delivered':
          if (contract.status !== 'in_progress') {
            throw new Error('Solo se puede entregar si está en progreso');
          }
          if (!isSeller) {
            throw new Error('Solo el vendedor puede marcar como entregado');
          }
          await contract.update({
            status: 'delivered',
            deliveredAt: now,
            deliveryFiles: deliveryFiles || []
          }, { transaction: t });
          break;

        case 'completed':
          if (contract.status !== 'delivered') {
            throw new Error('Solo se puede completar si está entregado');
          }
          if (!isBuyer) {
            throw new Error('Solo el comprador puede completar el contrato');
          }

          // Liberar fondos del escrow al vendedor
          const escrow = contract.escrow;
          const seller = contract.seller;

          const newSellerBalance = parseFloat(seller.qzBalance) + parseFloat(escrow.amount);
          await seller.update({ qzBalance: newSellerBalance.toFixed(2) }, { transaction: t });

          // Registrar transacción
          await WalletTx.create({
            userId: seller.id,
            amountQz: parseFloat(escrow.amount),
            kind: 'credit',
            category: 'contract_payment',
            description: `Pago recibido - Contrato ${contract.contractNumber}`
          }, { transaction: t });

          // Actualizar escrow
          await escrow.update({
            status: 'released',
            releasedAt: now
          }, { transaction: t });

          // Actualizar contrato
          await contract.update({
            status: 'completed',
            completedAt: now
          }, { transaction: t });
          break;

        case 'cancelled':
          if (!['pending', 'paid'].includes(contract.status)) {
            throw new Error('Solo se puede cancelar en estado pending o paid');
          }

          // Si ya está pagado, reembolsar al comprador
          if (contract.status === 'paid') {
            const buyer = contract.buyer;
            const refundAmount = parseFloat(contract.totalAmount);
            const newBuyerBalance = parseFloat(buyer.qzBalance) + refundAmount;

            await buyer.update({ qzBalance: newBuyerBalance.toFixed(2) }, { transaction: t });

            await WalletTx.create({
              userId: buyer.id,
              amountQz: refundAmount,
              kind: 'credit',
              category: 'refund',
              description: `Reembolso - Contrato ${contract.contractNumber} cancelado`
            }, { transaction: t });

            await contract.escrow.update({
              status: 'cancelled'
            }, { transaction: t });
          }

          await contract.update({
            status: 'cancelled',
            cancellationReason: reason || 'Sin especificar'
          }, { transaction: t });
          break;

        case 'disputed':
          if (!['in_progress', 'delivered'].includes(contract.status)) {
            throw new Error('Solo se puede disputar en progreso o entregado');
          }

          await contract.update({
            status: 'disputed',
            disputeReason: reason || 'Sin especificar'
          }, { transaction: t });

          await contract.escrow.update({
            status: 'disputed'
          }, { transaction: t });
          break;

        default:
          throw new Error('Estado inválido');
      }
    });

    // Retornar contrato actualizado
    const updatedContract = await Contract.findByPk(id, {
      include: [
        { model: Service, as: 'service' },
        { model: User, as: 'buyer', attributes: ['id', 'fullName', 'avatar'] },
        { model: User, as: 'seller', attributes: ['id', 'fullName', 'avatar'] },
        { model: EscrowAccount, as: 'escrow' }
      ]
    });

    res.json({
      success: true,
      message: `Contrato actualizado a estado: ${status}`,
      contract: updatedContract
    });

  } catch (error) {
    console.error('Error actualizando contrato:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar contrato'
    });
  }
}

// ============================================
// MIS COMPRAS (COMO COMPRADOR)
// ============================================

async function getMyPurchases(req, res) {
  try {
    const buyerId = req.userId;
    const { status, page = 1, limit = 20 } = req.query;

    const where = { buyerId };
    if (status) where.status = status;

    const offset = (page - 1) * limit;

    const { count, rows: contracts } = await Contract.findAndCountAll({
      where,
      include: [
        { model: Service, as: 'service', attributes: ['id', 'title', 'category', 'imageUrl'] },
        { model: User, as: 'seller', attributes: ['id', 'fullName', 'avatar'] },
        { model: EscrowAccount, as: 'escrow', attributes: ['id', 'status', 'amount'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      contracts,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo compras:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener compras',
      error: error.message
    });
  }
}

// ============================================
// MIS VENTAS (COMO VENDEDOR)
// ============================================

async function getMySales(req, res) {
  try {
    const sellerId = req.userId;
    const { status, page = 1, limit = 20 } = req.query;

    const where = { sellerId };
    if (status) where.status = status;

    const offset = (page - 1) * limit;

    const { count, rows: contracts } = await Contract.findAndCountAll({
      where,
      include: [
        { model: Service, as: 'service', attributes: ['id', 'title', 'category', 'imageUrl'] },
        { model: User, as: 'buyer', attributes: ['id', 'fullName', 'avatar'] },
        { model: EscrowAccount, as: 'escrow', attributes: ['id', 'status', 'amount'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      contracts,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ventas',
      error: error.message
    });
  }
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  createContract,
  getContract,
  updateContractStatus,
  getMyPurchases,
  getMySales,
  createContractValidators,
  updateStatusValidators
};

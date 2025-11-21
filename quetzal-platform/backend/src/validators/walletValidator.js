// ============================================
// VALIDATORS/WALLETVALIDATOR.JS - Validadores para Wallet
// ============================================

const { body } = require("express-validator");
const { User } = require("../models");

// ============================================
// 1️⃣ VALIDADORES PARA RECARGA MANUAL
// ============================================
const topupValidators = [
  body("amount")
    .isFloat({ min: 0.01 })
    .withMessage("El monto debe ser un número positivo.")
    .toFloat(),
];

// ============================================
// 2️⃣ VALIDADORES PARA TRANSFERENCIAS
// ============================================
const transferValidators = [
  body("targetUserId")
    .isUUID()
    .withMessage("El ID de usuario destino no es válido.")
    .custom(async (value) => {
      const user = await User.findByPk(value);
      if (!user) throw new Error("El usuario destino no existe.");
      return true;
    }),

  body("amount")
    .isFloat({ min: 0.01 })
    .withMessage("El monto debe ser mayor a 0.")
    .toFloat(),

  body("description")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage("La descripción no debe exceder 255 caracteres."),
];

// ============================================
// 3️⃣ VALIDADORES PARA RETIROS (QZ → COP)
// Coincide EXACTAMENTE con walletController.withdraw
// ============================================
const withdrawValidators = [
  body("amountQZ")
    .isFloat({ min: 0.01 })
    .withMessage("El monto QZ debe ser mayor a 0.")
    .toFloat(),

  body("bankName")
    .notEmpty()
    .withMessage("El nombre del banco es obligatorio.")
    .isString()
    .trim()
    .isLength({ max: 100 }),

  body("accountType")
    .notEmpty()
    .withMessage("El tipo de cuenta es obligatorio.")
    .isIn(["ahorros", "corriente"])
    .withMessage("Tipo de cuenta inválido (ahorros/corriente)."),

  body("accountNumber")
    .notEmpty()
    .withMessage("El número de cuenta es obligatorio.")
    .matches(/^[0-9]{6,20}$/)
    .withMessage("El número de cuenta debe tener entre 6 y 20 dígitos."),

  body("accountHolder")
    .notEmpty()
    .withMessage("El titular de la cuenta es obligatorio.")
    .isString()
    .trim()
    .isLength({ max: 120 }),
];

// ============================================
// 4️⃣ VALIDADORES PARA PSE INIT
// ============================================
const pseInitValidators = [
  body("amountCOP")
    .isFloat({ min: 1 })
    .withMessage("El monto COP debe ser mayor a 0.")
    .toFloat(),

  body("bankCode")
    .notEmpty()
    .withMessage("El código del banco es obligatorio.")
    .isString()
    .trim(),

  body("personType")
    .isIn(["natural", "juridica"])
    .withMessage("Tipo de persona inválido."),

  body("documentType")
    .notEmpty()
    .withMessage("Tipo de documento requerido.")
    .isString()
    .trim(),

  body("documentNumber")
    .notEmpty()
    .withMessage("Número de documento requerido.")
    .matches(/^[0-9]+$/)
    .withMessage("El documento debe contener solo dígitos.")
    .isLength({ min: 6, max: 15 }),

  body("email")
    .isEmail()
    .withMessage("Email inválido.")
    .normalizeEmail(),
];

// ============================================
// 5️⃣ VALIDADORES PARA INICIAR PAGO ePayco
// ============================================
const epaycoInitValidators = [
  body("amountCOP")
    .isFloat({ min: 1 })
    .withMessage("El monto en COP debe ser mayor a 0.")
    .toFloat(),

  body("email")
    .isEmail()
    .withMessage("Email inválido.")
    .normalizeEmail(),
];

module.exports = {
  topupValidators,
  transferValidators,
  withdrawValidators,
  pseInitValidators,
  epaycoInitValidators,
};

// ===============================
// currency.js  (Nuevo módulo)
// Conversión entre COP ↔ QZ
// ===============================

// Valor de 1 QZ en COP (puedes ajustarlo o cargarlo desde BD si algún día quieres)
const QZ_TO_COP = 1000; 

// -------------------------------
// COP → QZ
// -------------------------------
function copToQZ(copAmount) {
  if (!copAmount || isNaN(copAmount)) return 0;
  return parseFloat(copAmount) / QZ_TO_COP;
}

// -------------------------------
// QZ → COP
// -------------------------------
function qzToCop(qzAmount) {
  if (!qzAmount || isNaN(qzAmount)) return 0;
  return parseFloat(qzAmount) * QZ_TO_COP;
}

module.exports = {
  QZ_TO_COP,
  copToQZ,
  qzToCop
};

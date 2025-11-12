const { sequelize, QZ_TO_FIAT, User, WalletTx } = require('../models');
const { body, validationResult } = require('express-validator');

const topupValidators = [ body('fiatAmount').isFloat({ gt: 0 }) ];
const transferValidators = [ body('toUserId').isInt().toInt(), body('qzAmount').isFloat({ gt: 0 }) ];
const withdrawValidators = [ body('fiatAmount').isFloat({ gt: 0 }) ];

async function summary(req,res){
  const user = await User.findByPk(req.userId);
  const txs = await WalletTx.findAll({ where: { userId: req.userId }, order:[['createdAt','DESC']], limit: 50 });
  res.json({ success:true, balanceQz: Number(user.qzBalance), txs, rate: { QZ_TO_FIAT } });
}

async function topup(req,res){
  const errors = validationResult(req); if(!errors.isEmpty()) return res.status(400).json({ success:false, errors: errors.array() });
  const { fiatAmount } = req.body;
  const qz = Number(fiatAmount) / QZ_TO_FIAT;
  await sequelize.transaction(async (t) => {
    const user = await User.findByPk(req.userId, { transaction: t, lock: t.LOCK.UPDATE });
    const balance = Number(user.qzBalance);
    await user.update({ qzBalance: (balance + qz).toFixed(2) }, { transaction: t });
    await WalletTx.create({ userId: user.id, amountQz: qz, kind: 'credit', category: 'topup', description: `Recarga $${fiatAmount} => +${qz} Qz` }, { transaction: t });
  });
  res.json({ success:true, creditedQz: qz });
}

async function transfer(req,res){
  const errors = validationResult(req); if(!errors.isEmpty()) return res.status(400).json({ success:false, errors: errors.array() });
  const { toUserId, qzAmount } = req.body;
  if (toUserId === req.userId) return res.status(400).json({ success:false, message:'No puedes transferirte a ti mismo' });
  await sequelize.transaction(async (t) => {
    const from = await User.findByPk(req.userId, { transaction: t, lock: t.LOCK.UPDATE });
    const to = await User.findByPk(toUserId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!to) throw new Error('Destino no encontrado');
    const qz = Number(qzAmount);
    if (Number(from.qzBalance) < qz) throw new Error('Fondos insuficientes');
    await from.update({ qzBalance: (Number(from.qzBalance) - qz).toFixed(2) }, { transaction: t });
    await to.update({ qzBalance: (Number(to.qzBalance) + qz).toFixed(2) }, { transaction: t });
    await WalletTx.create({ userId: from.id, amountQz: qz, kind: 'debit', category: 'transfer', description: `Transferencia a ${to.fullName}` }, { transaction: t });
    await WalletTx.create({ userId: to.id, amountQz: qz, kind: 'credit', category: 'transfer', description: `Transferencia de ${from.fullName}` }, { transaction: t });
  });
  res.json({ success:true });
}

async function withdraw(req,res){
  const errors = validationResult(req); if(!errors.isEmpty()) return res.status(400).json({ success:false, errors: errors.array() });
  const { fiatAmount } = req.body;
  const qz = Number(fiatAmount) / QZ_TO_FIAT;
  await sequelize.transaction(async (t) => {
    const user = await User.findByPk(req.userId, { transaction: t, lock: t.LOCK.UPDATE });
    if (Number(user.qzBalance) < qz) throw new Error('Fondos insuficientes');
    await user.update({ qzBalance: (Number(user.qzBalance) - qz).toFixed(2) }, { transaction: t });
    await WalletTx.create({ userId: user.id, amountQz: qz, kind: 'debit', category: 'withdraw', description: `Retiro $${fiatAmount} (-${qz} Qz)` }, { transaction: t });
  });
  res.json({ success:true, debitedQz: Number(fiatAmount) / QZ_TO_FIAT });
}

function quote(req,res){
  const fiat = Number(req.query.fiat||0);
  const qz = fiat ? fiat / QZ_TO_FIAT : null;
  res.json({ success:true, rate: { QZ_TO_FIAT }, fiat, qz });
}

module.exports = { summary, topup, transfer, withdraw, quote, topupValidators, transferValidators, withdrawValidators };

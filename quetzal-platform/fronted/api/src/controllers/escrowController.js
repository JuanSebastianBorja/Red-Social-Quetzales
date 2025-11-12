const { sequelize, User, Service, Escrow, WalletTx } = require('../models');
const { body, param, validationResult } = require('express-validator');

const createValidators = [
  body('serviceId').isInt().toInt(),
  body('amountQz').isFloat({ gt: 0 }),
  body('sellerId').optional().isInt().toInt()
];
const idParam = [ param('id').isInt().toInt() ];

async function create(req,res){
  const errors = validationResult(req); if(!errors.isEmpty()) return res.status(400).json({ success:false, errors: errors.array() });
  const { serviceId, amountQz, sellerId } = req.body;
  const service = await Service.findByPk(serviceId);
  if (!service) return res.status(404).json({ success:false, message:'Servicio no existe' });
  const seller = await (sellerId ? User.findByPk(sellerId) : User.findByPk(service.ownerId));
  if (!seller) return res.status(404).json({ success:false, message:'Vendedor no existe' });
  const esc = await Escrow.create({ serviceId: service.id, buyerId: req.userId, sellerId: seller.id, amountQz, status:'created' });
  res.status(201).json({ success:true, data: esc });
}

async function fund(req,res){
  const esc = await Escrow.findByPk(req.params.id);
  if (!esc) return res.status(404).json({ success:false, message:'Escrow no existe' });
  if (esc.buyerId !== req.userId) return res.status(403).json({ success:false, message:'No autorizado' });
  if (esc.status !== 'created') return res.status(400).json({ success:false, message:'Estado inválido' });
  await sequelize.transaction(async (t) => {
    const buyer = await User.findByPk(esc.buyerId, { transaction: t, lock: t.LOCK.UPDATE });
    const qz = Number(esc.amountQz);
    if (Number(buyer.qzBalance) < qz) throw new Error('Fondos insuficientes');
    await buyer.update({ qzBalance: (Number(buyer.qzBalance)-qz).toFixed(2) }, { transaction: t });
    await WalletTx.create({ userId: buyer.id, amountQz: qz, kind:'debit', category:'escrow_fund', description:`Fondeo escrow #${esc.id}` }, { transaction: t });
    await esc.update({ status:'funded' }, { transaction: t });
  });
  res.json({ success:true, data: await Escrow.findByPk(req.params.id) });
}

async function release(req,res){
  const esc = await Escrow.findByPk(req.params.id);
  if (!esc) return res.status(404).json({ success:false, message:'Escrow no existe' });
  if (esc.status !== 'funded') return res.status(400).json({ success:false, message:'Estado inválido' });
  if (esc.buyerId !== req.userId) return res.status(403).json({ success:false, message:'No autorizado' });
  await sequelize.transaction(async (t) => {
    const seller = await User.findByPk(esc.sellerId, { transaction: t, lock: t.LOCK.UPDATE });
    const qz = Number(esc.amountQz);
    await seller.update({ qzBalance: (Number(seller.qzBalance)+qz).toFixed(2) }, { transaction: t });
    await WalletTx.create({ userId: seller.id, amountQz: qz, kind:'credit', category:'escrow_release', description:`Liberación escrow #${esc.id}` }, { transaction: t });
    await esc.update({ status:'released' }, { transaction: t });
  });
  res.json({ success:true, data: await Escrow.findByPk(req.params.id) });
}

async function cancel(req,res){
  const esc = await Escrow.findByPk(req.params.id);
  if (!esc) return res.status(404).json({ success:false, message:'Escrow no existe' });
  if (![ 'created','funded' ].includes(esc.status)) return res.status(400).json({ success:false, message:'No cancelable' });
  if (esc.buyerId !== req.userId) return res.status(403).json({ success:false, message:'No autorizado' });
  await sequelize.transaction(async (t) => {
    if (esc.status === 'funded') {
      const buyer = await User.findByPk(esc.buyerId, { transaction: t, lock: t.LOCK.UPDATE });
      const qz = Number(esc.amountQz);
      await buyer.update({ qzBalance: (Number(buyer.qzBalance)+qz).toFixed(2) }, { transaction: t });
      await WalletTx.create({ userId: buyer.id, amountQz: qz, kind:'credit', category:'refund', description:`Reembolso escrow #${esc.id}` }, { transaction: t });
    }
    await esc.update({ status:'cancelled' }, { transaction: t });
  });
  res.json({ success:true, data: await Escrow.findByPk(req.params.id) });
}

async function dispute(req,res){
  const esc = await Escrow.findByPk(req.params.id);
  if (!esc) return res.status(404).json({ success:false, message:'Escrow no existe' });
  if (esc.buyerId !== req.userId && esc.sellerId !== req.userId) return res.status(403).json({ success:false, message:'No autorizado' });
  await esc.update({ status:'disputed' });
  res.json({ success:true, data: esc });
}

module.exports = { create, fund, release, cancel, dispute, createValidators, idParam };

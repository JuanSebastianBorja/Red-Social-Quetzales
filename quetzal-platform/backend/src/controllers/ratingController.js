
const { Rating } = require('../models');
const { body, param, validationResult } = require('express-validator');

const createValidators = [
  body('serviceId').isInt().toInt(),
  body('rateeId').isInt().toInt(),
  body('score').isInt({ min:1, max:5 }),
  body('comment').optional().isString().isLength({ max: 500 })
];
const serviceParam = [ param('serviceId').isInt().toInt() ];

async function create(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success:false, errors: errors.array() });
  const { serviceId, rateeId, score, comment } = req.body;
  const rating = await Rating.create({ serviceId, rateeId, raterId: req.userId, score, comment });
  res.status(201).json({ success:true, data: rating });
}
async function listByService(req, res) {
  const ratings = await Rating.findAll({ where: { serviceId: req.params.serviceId }, order: [['createdAt','DESC']] });
  res.json({ success:true, data: ratings });
}
module.exports = { create, listByService, createValidators, serviceParam };

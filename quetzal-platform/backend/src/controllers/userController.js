const { Op, User } = require('../models');
const { body, validationResult } = require('express-validator');

async function search(req,res){
  const { q='', page=1, limit=12 } = req.query;
  const where = q? { [Op.or]: [
    { fullName: { [Op.like]: `%${q}%` } },
    { email: { [Op.like]: `%${q}%` } },
    { username: { [Op.like]: `%${q}%` } }
  ] } : {};
  const { rows, count } = await User.findAndCountAll({ where, attributes: ['id','username','fullName','email','avatarUrl','headline','skills','location','role'], limit: Number(limit), offset:(Number(page)-1)*Number(limit), order:[['createdAt','DESC']] });
  res.json({ success:true, data: rows, total: count, page: Number(page), pages: Math.ceil(count/limit) });
}

const updateValidators = [
  body('fullName').optional().isLength({min:2}),
  body('username').optional().isLength({min:3}),
  body('avatarUrl').optional().isURL().isLength({ max: 500 }).withMessage('URL demasiado larga'),
  body('headline').optional().isLength({ max: 120 }),
  body('skills').optional().isLength({ max: 200 }),
  body('website').optional().isURL(),
  body('preferencesJson').optional().isObject()
];

async function updateMe(req,res){
  const errors = validationResult(req); if(!errors.isEmpty()) return res.status(400).json({ success:false, errors: errors.array() });
  const u = await User.findByPk(req.userId);
  const { username } = req.body;
  if (username && username !== u.username){
    const taken = await User.findOne({ where:{ username } });
    if (taken) return res.status(409).json({ success:false, message:'Usuario ya existe' });
  }
  await u.update(req.body);
  res.json({ success:true, user: u });
}

module.exports = { search, updateMe, updateValidators };

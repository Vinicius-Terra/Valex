import joi from 'joi';


export const creatCardSchema = joi.object({
  cardType: joi.string().valid('groceries', 'restaurants', 'transport', 'education', 'health').required(),
  employeeId: joi.number().required()
});

export const rechargeCardSchema = joi.object({
  cardId: joi.number().required(),
  amount: joi.number().min(0).required()
});

export const purchaseCardSchema = joi.object({
  cardId: joi.number().required(),
  businessId: joi.number().integer().required(),
  amount: joi.number().min(0).required(),
  password: joi.number().integer().min(1000).required()
});
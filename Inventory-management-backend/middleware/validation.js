const Joi = require('joi');

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

// Validation schemas
const schemas = {
  // User schemas
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),

  // Vendor schemas
  vendor: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    contact: Joi.string().min(10).max(15).required(),
    email: Joi.string().email().optional(),
    gst_no: Joi.string().max(15).optional(),
    address: Joi.string().max(500).optional()
  }),

  // Customer schemas
  customer: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    contact: Joi.string().min(10).max(15).required(),
    email: Joi.string().email().optional(),
    gst_no: Joi.string().max(15).optional(),
    address: Joi.string().max(500).optional()
  }),

  // Product schemas
  product: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    sku: Joi.string().min(3).max(50).required(),
    barcode: Joi.string().max(50).optional(),
    category: Joi.string().min(2).max(100).required(),
    price: Joi.number().positive().required(),
    gst_rate: Joi.number().min(0).max(50).default(0),
    warranty_months: Joi.number().min(0).max(120).default(0),
    description: Joi.string().max(1000).optional()
  }),

  // Purchase schemas
  purchase: Joi.object({
    vendor_id: Joi.number().integer().positive().required(),
    product_id: Joi.number().integer().positive().required(),
    qty: Joi.number().integer().positive().required(),
    price: Joi.number().positive().required(),
    purchase_date: Joi.date().optional()
  }),

  // Sales schemas
  sale: Joi.object({
    customer_id: Joi.number().integer().positive().optional(),
    product_id: Joi.number().integer().positive().required(),
    qty: Joi.number().integer().positive().required(),
    price: Joi.number().positive().required(),
    gst_applied: Joi.boolean().default(false),
    sale_date: Joi.date().optional()
  })
};

module.exports = {
  validate,
  schemas
};

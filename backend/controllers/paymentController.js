// backend/controllers/paymentController.js
const { Payment, Customer } = require('../models');
const { sequelize } = require('../models');

// Record a new payment for a customer
exports.createPayment = async (req, res) => {
    const { customerId, amount, paymentMethod, notes, saleId } = req.body;
    
    if (!customerId || !amount || !paymentMethod) {
        return res.status(400).json({ error: 'Customer ID, amount, and payment method are required.' });
    }

    let transaction;
    try {
        transaction = await sequelize.transaction();

        const customer = await Customer.findByPk(customerId, { transaction });
        if (!customer) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Customer not found' });
        }

        const payment = await Payment.create({
            customerId,
            amount: parseFloat(amount),
            paymentMethod,
            notes,
            saleId: saleId || null
        }, { transaction });

        // Update customer's outstanding balance
        customer.outstandingBalance = (customer.outstandingBalance || 0) - parseFloat(amount);
        await customer.save({ transaction });

        await transaction.commit();
        res.status(201).json(payment);
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Failed to record payment:', error);
        res.status(500).json({ error: 'Failed to record payment', details: error.message });
    }
};

// Get all payments for a specific customer
exports.getCustomerPayments = async (req, res) => {
    const { customerId } = req.params;
    try {
        const payments = await Payment.findAll({
            where: { customerId },
            order: [['paymentDate', 'DESC']]
        });
        res.json(payments);
    } catch (error) {
        console.error('Failed to fetch payments:', error);
        res.status(500).json({ error: 'Failed to fetch payments', details: error.message });
    }
};

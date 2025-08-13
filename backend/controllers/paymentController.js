// backend/controllers/paymentController.js
const db = require('../models'); // dynamic models and sequelize

// Record a new payment for a customer
exports.createPayment = async (req, res) => {
    const { customerId, amount, paymentMethod, notes, saleId } = req.body;
    
    if (!customerId || !amount || !paymentMethod) {
        return res.status(400).json({ error: 'Customer ID, amount, and payment method are required.' });
    }

    let transaction;
    try {
        transaction = await db.sequelize.transaction();

        const customer = await db.Customer.findByPk(customerId, { transaction });
        if (!customer) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Customer not found' });
        }

        const payment = await db.Payment.create({
            customerId,
            amount: parseFloat(amount),
            paymentMethod,
            notes,
            saleId: saleId || null // Allow saleId to be optional or null
        }, { transaction });

        // Update customer's outstanding balance
        // Subtract the new payment amount from the outstanding balance
        customer.outstandingBalance = (parseFloat(customer.outstandingBalance) || 0) - parseFloat(amount);
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
    const { customerId } = req.params; // Correctly extract customerId from req.params
    if (!customerId) {
        console.error('Error: customerId is undefined in getCustomerPayments');
        return res.status(400).json({ error: 'Customer ID is required.' });
    }
    try {
        const payments = await db.Payment.findAll({
            where: { customerId },
            order: [['paymentDate', 'DESC']]
        });
        res.json(payments);
    } catch (error) {
        console.error('Failed to fetch payments:', error);
        res.status(500).json({ error: 'Failed to fetch payments', details: error.message });
    }
};

// Delete a payment and add its amount back to the customer's outstanding balance
exports.deletePayment = async (req, res) => {
    const paymentId = req.params.id; // Get payment ID from route parameters

    let transaction;
    try {
        transaction = await db.sequelize.transaction();

        const payment = await db.Payment.findByPk(paymentId, { transaction });
        if (!payment) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Payment not found.' });
        }

        const customerId = payment.customerId;
        const amount = payment.amount;

        // Delete the payment record within the transaction
        await payment.destroy({ transaction });

        // Find the customer and add the payment amount back to their outstanding balance
        const customer = await db.Customer.findByPk(customerId, { transaction });
        if (customer) {
            customer.outstandingBalance = (parseFloat(customer.outstandingBalance) || 0) + parseFloat(amount);
            await customer.save({ transaction });
        } else {
            // Log a warning if customer not found, but proceed with payment deletion
            console.warn(`Customer with ID ${customerId} not found when trying to revert balance for payment ${paymentId}. Payment was deleted.`);
        }

        await transaction.commit();
        res.status(204).send(); // 204 No Content for successful deletion
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Error deleting payment:', error);
        res.status(500).json({ error: 'Failed to delete payment.', details: error.message });
    }
};
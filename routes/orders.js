const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const { notifyTelegram } = require('../utils/telegram');

// Only signed-in customers can place an order. The user must still exist, so a
// token issued before an account was deleted stops working immediately.
async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    req.userId = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET).userId;
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  try {
    const user = await User.findById(req.userId).select('_id');
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
  next();
}

const VALID_METHODS = ['netbanking', 'upi', 'cod'];

// Banks accepted by the (simulated) Net Banking gateway.
const VALID_BANKS = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'Canara Bank',
  'Union Bank of India',
  'Yes Bank',
  'IDFC First Bank',
  'Indian Bank'
];

router.post('/', requireAuth, async (req, res) => {
  try {
    const { customerName, email, phone, address, items, paymentMethod, paymentDetails } = req.body;

    if (!customerName || !phone || !address) {
      return res.status(400).json({ error: 'Name, phone, and delivery address are required' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    if (!VALID_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ error: 'Choose a valid payment method: netbanking, upi, or cod' });
    }
    if (paymentMethod === 'upi' && !paymentDetails?.upiId) {
      return res.status(400).json({ error: 'UPI ID is required for UPI payments' });
    }
    if (paymentMethod === 'netbanking' && !VALID_BANKS.includes(paymentDetails?.bankName)) {
      return res.status(400).json({ error: 'Please choose a valid bank for Net Banking' });
    }

    const totalAmount = items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);

    const order = await Order.create({
      userId: req.userId,
      customerName,
      email,
      phone,
      address,
      items,
      totalAmount,
      paymentMethod,
      // The Net Banking "gateway" is simulated on the frontend and confirms the
      // payment before the order is placed, so netbanking orders come in as paid.
      // UPI/COD stay pending for staff to confirm.
      paymentStatus: paymentMethod === 'netbanking' ? 'paid' : 'pending',
      paymentDetails: paymentMethod === 'upi'
        ? { upiId: paymentDetails.upiId }
        : paymentMethod === 'netbanking'
          ? { bankName: paymentDetails.bankName }
          : {}
    });

    notifyTelegram(
      'NEW ORDER - S.L.A Fruit Shop\n' +
        `Order ID: ${order._id}\n` +
        `Customer: ${customerName}\n` +
        `Phone: ${phone}\n` +
        `Email: ${email || '-'}\n` +
        `Address: ${address}\n` +
        `Items: ${items.map((i) => `${i.qty} x ${i.name} (Rs ${i.price})`).join(', ')}\n` +
        `Total: Rs ${totalAmount}\n` +
        `Payment: ${paymentMethod} (${paymentMethod === 'netbanking' ? 'paid' : 'pending'})`
    );

    res.status(201).json({
      message: 'Order placed successfully',
      order: {
        id: order._id,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt
      }
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Server error placing order' });
  }
});

router.get('/mine', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Fetch orders error:', err);
    res.status(500).json({ error: 'Server error fetching orders' });
  }
});

module.exports = router;

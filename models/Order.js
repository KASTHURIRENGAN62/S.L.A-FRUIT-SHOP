const mongoose = require('mongoose');

/*
 * Orders are kept in a SEPARATE MongoDB database from the users/auth data,
 * as requested. By default it points at ORDERS_MONGODB_URI (set this to a
 * different MongoDB Atlas database than MONGODB_URI, e.g. same cluster,
 * different database name: ".../fruit-shop-orders" vs ".../fruit-shop").
 * If ORDERS_MONGODB_URI isn't set, it falls back to MONGODB_URI so the app
 * still runs out of the box.
 */
const ordersConnection = mongoose.createConnection(
  process.env.ORDERS_MONGODB_URI || process.env.MONGODB_URI
);

ordersConnection.on('connected', () => console.log('Orders DB connected'));
ordersConnection.on('error', (err) => console.error('Orders DB connection error:', err));

const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  unit: { type: String },
  qty: { type: Number, required: true, min: 1 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  // Not a hard ref (different DB), just store the id + a snapshot of contact info.
  userId: { type: mongoose.Schema.Types.ObjectId },
  customerName: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },

  items: { type: [orderItemSchema], required: true, validate: v => Array.isArray(v) && v.length > 0 },
  totalAmount: { type: Number, required: true },

  paymentMethod: { type: String, enum: ['netbanking', 'upi', 'cod'], required: true },
  paymentDetails: {
    bankName: { type: String },   // for netbanking
    upiId: { type: String }       // for upi
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    // COD is only "paid" on delivery. The Net Banking flow uses a simulated
    // frontend gateway that "confirms" payment before the order is placed, so
    // netbanking orders are created as paid (routes/orders.js). UPI stays
    // pending for staff to confirm after the customer scans and pays.
    default: 'pending'
  },
  orderStatus: { type: String, enum: ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'placed' },

  createdAt: { type: Date, default: Date.now }
});

module.exports = ordersConnection.model('Order', orderSchema);

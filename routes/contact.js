const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

router.post('/', async (req, res) => {
  try {
    const { name, phone, service, address, message } = req.body;
    if (!name || !phone || !service || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const contact = await Contact.create({ name, phone, service, address, message });
    res.status(201).json({ message: 'Message sent successfully', contact });
  } catch (err) {
    console.error('Contact save error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

// backend/routes/dashboard.js
const express = require('express');
const router = express.Router();

router.get('/dashboard-data', (req, res) => {
  res.json({ message: 'Dashboard verileri rotası çalışıyor.' });
});

module.exports = router;
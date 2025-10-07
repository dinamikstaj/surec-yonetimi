// routes/maintenanceContractRoutes.js - Bakım anlaşması oluşturma ve fiyat belirleme

const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// Create new maintenance contract
router.post('/create', async (req, res) => {
  try {
    const {
      customerId,
      startDate,
      endDate,
      value,
      description,
      terms,
      paymentSchedule
    } = req.body;

    // Validate required fields
    if (!customerId || !startDate || !endDate || !value) {
      return res.status(400).json({ msg: 'Gerekli alanlar eksik (müşteri, başlangıç tarihi, bitiş tarihi, fiyat)' });
    }

    // Verify customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ msg: 'Müşteri bulunamadı' });
    }

    // Check if customer already has active maintenance contract
    if (customer.hasMaintenanceContract && customer.maintenanceEndDate && new Date(customer.maintenanceEndDate) > new Date()) {
      return res.status(400).json({ msg: 'Müşterinin zaten aktif bakım anlaşması var' });
    }

    // Update customer with maintenance contract
    customer.hasMaintenanceContract = true;
    customer.maintenanceStartDate = new Date(startDate);
    customer.maintenanceEndDate = new Date(endDate);
    customer.maintenanceValue = value;
    
    if (description) customer.notes = description;

    await customer.save();

    res.status(201).json({
      msg: `${customer.company} için bakım anlaşması oluşturuldu`,
      customer,
      contract: {
        startDate: customer.maintenanceStartDate,
        endDate: customer.maintenanceEndDate,
        value: customer.maintenanceValue,
        duration: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) // days
      }
    });
  } catch (error) {
    console.error('Maintenance contract creation error:', error);
    res.status(500).json({ msg: 'Bakım anlaşması oluşturulamadı', error: error.message });
  }
});

// Update maintenance contract
router.put('/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const {
      startDate,
      endDate,
      value,
      description
    } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ msg: 'Müşteri bulunamadı' });
    }

    // Update maintenance contract details
    if (startDate) customer.maintenanceStartDate = new Date(startDate);
    if (endDate) customer.maintenanceEndDate = new Date(endDate);
    if (value) customer.maintenanceValue = value;
    if (description) customer.notes = description;

    await customer.save();

    res.json({
      msg: `${customer.company} bakım anlaşması güncellendi`,
      customer
    });
  } catch (error) {
    console.error('Maintenance contract update error:', error);
    res.status(500).json({ msg: 'Bakım anlaşması güncellenemedi', error: error.message });
  }
});

// Cancel maintenance contract
router.post('/:customerId/cancel', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { reason, notes } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ msg: 'Müşteri bulunamadı' });
    }

    if (!customer.hasMaintenanceContract) {
      return res.status(400).json({ msg: 'Müşterinin aktif bakım anlaşması yok' });
    }

    // Cancel the contract
    customer.hasMaintenanceContract = false;
    customer.contractCancelledAt = new Date();
    customer.cancellationReason = reason;
    customer.cancellationNotes = notes;

    await customer.save();

    res.json({
      msg: `${customer.company} bakım anlaşması iptal edildi`,
      customer
    });
  } catch (error) {
    console.error('Maintenance contract cancellation error:', error);
    res.status(500).json({ msg: 'Bakım anlaşması iptal edilemedi', error: error.message });
  }
});

// Get contract pricing suggestions
router.get('/pricing-suggestions', async (req, res) => {
  try {
    const { customerId, serviceType, duration } = req.query;

    // Base pricing logic (you can make this more sophisticated)
    const basePrices = {
      'basic': 15000,
      'standard': 25000,
      'premium': 40000,
      'enterprise': 60000
    };

    const durationMultipliers = {
      '6': 0.6,   // 6 months
      '12': 1.0,  // 1 year (base)
      '24': 1.8,  // 2 years
      '36': 2.5   // 3 years
    };

    const suggestions = Object.keys(basePrices).map(type => {
      const basePrice = basePrices[type];
      const multiplier = durationMultipliers[duration] || 1.0;
      const finalPrice = Math.floor(basePrice * multiplier);

      return {
        type,
        name: {
          'basic': 'Temel Bakım',
          'standard': 'Standart Bakım', 
          'premium': 'Premium Bakım',
          'enterprise': 'Kurumsal Bakım'
        }[type],
        price: finalPrice,
        features: {
          'basic': ['Aylık sistem kontrolü', 'Telefon desteği', 'Temel raporlama'],
          'standard': ['Haftalık sistem kontrolü', '7/24 telefon desteği', 'Detaylı raporlama', 'Uzaktan erişim'],
          'premium': ['Günlük izleme', '7/24 öncelikli destek', 'Proaktif bakım', 'Yerinde destek'],
          'enterprise': ['Sürekli izleme', 'Özel destek ekibi', 'SLA garantisi', 'Stratejik danışmanlık']
        }[type]
      };
    });

    res.json({
      suggestions,
      duration: duration || '12',
      baseCurrency: 'TRY'
    });
  } catch (error) {
    console.error('Pricing suggestions error:', error);
    res.status(500).json({ msg: 'Fiyat önerileri getirilemedi', error: error.message });
  }
});

module.exports = router;

// routes/maintenanceRoutes.js

const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// Get active maintenance customers
router.get('/active', async (req, res) => {
  try {
    const { search, city } = req.query;

    let query = { 
      hasMaintenanceContract: true
    };

    // City filter
    if (city) {
      query.city = new RegExp(city, 'i');
    }

    let customers = await Customer.find(query).sort({ maintenanceEndDate: 1 });

    // Filter only truly active contracts (if maintenanceEndDate exists and is future)
    // If no maintenanceEndDate, assume active (for existing data compatibility)
    customers = customers.filter(customer => {
      if (!customer.maintenanceEndDate) return true; // Include customers without end date
      return new Date(customer.maintenanceEndDate) > new Date();
    });

    // Gerçek veri tabanı verilerini kullan
    customers = customers.map(customer => customer.toObject());

    // Search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      customers = customers.filter(customer => 
        searchRegex.test(customer.company) ||
        searchRegex.test(customer.name) ||
        searchRegex.test(customer.email) ||
        searchRegex.test(customer.city || '')
      );
    }

    res.json(customers);
  } catch (error) {
    console.error('Active maintenance fetch error:', error);
    res.status(500).json({ msg: 'Aktif bakım anlaşmaları getirilemedi', error: error.message });
  }
});

// Get inactive maintenance customers
router.get('/inactive', async (req, res) => {
  try {
    const { search, reason } = req.query;

    let query = { 
      $or: [
        { hasMaintenanceContract: false },
        { 
          hasMaintenanceContract: true, 
          maintenanceEndDate: { $lt: new Date() } 
        }
      ]
    };

    let customers = await Customer.find(query).sort({ maintenanceEndDate: -1 });

    // Gerçek veri tabanı verilerini kullan
    customers = customers.map(customer => ({
      ...customer.toObject(),
      contractEndReason: customer.hasMaintenanceContract ? 'expired' : 'cancelled',
      lastMaintenanceDate: customer.maintenanceEndDate
    }));

    // Reason filter
    if (reason && reason !== 'all') {
      customers = customers.filter(customer => customer.contractEndReason === reason);
    }

    // Search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      customers = customers.filter(customer => 
        searchRegex.test(customer.company) ||
        searchRegex.test(customer.name) ||
        searchRegex.test(customer.email) ||
        searchRegex.test(customer.city || '')
      );
    }

    res.json(customers);
  } catch (error) {
    console.error('Inactive maintenance fetch error:', error);
    res.status(500).json({ msg: 'Pasif bakım anlaşmaları getirilemedi', error: error.message });
  }
});

// Get renewal maintenance customers
router.get('/renewal', async (req, res) => {
  try {
    const { search, urgency, probability } = req.query;

    // Get customers whose contracts expire within next 6 months
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    let query = { 
      hasMaintenanceContract: true,
      maintenanceEndDate: { 
        $gte: new Date(),
        $lte: sixMonthsFromNow 
      }
    };

    let customers = await Customer.find(query).sort({ maintenanceEndDate: 1 });

    // Gerçek veri tabanı verilerini kullan - yenileme bilgilerini hesapla
    customers = customers.map(customer => {
      const endDate = new Date(customer.maintenanceEndDate);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      let renewalProbability = 'medium';
      if (daysUntilExpiry <= 30) renewalProbability = 'high';
      else if (daysUntilExpiry > 90) renewalProbability = 'low';

      return {
        ...customer.toObject(),
        daysUntilExpiry,
        currentValue: customer.maintenanceValue || 0,
        renewalValue: customer.renewalValue || (customer.maintenanceValue ? Math.floor(customer.maintenanceValue * 1.1) : 0),
        renewalProbability,
        lastContactDate: customer.lastContactDate || customer.updatedAt,
        remindersSent: customer.remindersSent || 0
      };
    });

    // Urgency filter
    if (urgency && urgency !== 'all') {
      customers = customers.filter(customer => {
        const days = customer.daysUntilExpiry;
        switch (urgency) {
          case 'critical': return days <= 30;
          case 'urgent': return days > 30 && days <= 60;
          case 'normal': return days > 60;
          default: return true;
        }
      });
    }

    // Probability filter
    if (probability && probability !== 'all') {
      customers = customers.filter(customer => customer.renewalProbability === probability);
    }

    // Search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      customers = customers.filter(customer => 
        searchRegex.test(customer.company) ||
        searchRegex.test(customer.name) ||
        searchRegex.test(customer.email) ||
        searchRegex.test(customer.city || '')
      );
    }

    res.json(customers);
  } catch (error) {
    console.error('Renewal maintenance fetch error:', error);
    res.status(500).json({ msg: 'Yenileme anlaşmaları getirilemedi', error: error.message });
  }
});

// Send renewal reminder
router.post('/renewal/:id/reminder', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { message, type } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ msg: 'Müşteri bulunamadı' });
    }

    // Here you would integrate with email service
    // For now, just simulate success
    
    res.json({ 
      msg: `${customer.company} için hatırlatıcı gönderildi`,
      customer: customer.company,
      type: type || 'email'
    });
  } catch (error) {
    console.error('Renewal reminder error:', error);
    res.status(500).json({ msg: 'Hatırlatıcı gönderilemedi', error: error.message });
  }
});

// Start renewal process
router.post('/renewal/:id/start', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { notes, newValue, newEndDate } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ msg: 'Müşteri bulunamadı' });
    }

    // Update customer with renewal information
    if (newEndDate) {
      customer.maintenanceEndDate = newEndDate;
    }

    // Add renewal notes (you might want to create a separate RenewalProcess model)
    customer.renewalNotes = notes;
    
    await customer.save();

    res.json({ 
      msg: `${customer.company} için yenileme süreci başlatıldı`,
      customer
    });
  } catch (error) {
    console.error('Renewal start error:', error);
    res.status(500).json({ msg: 'Yenileme süreci başlatılamadı', error: error.message });
  }
});

// Reactivate inactive maintenance
router.post('/inactive/:id/reactivate', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { notes, newStartDate, newEndDate } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ msg: 'Müşteri bulunamadı' });
    }

    // Reactivate maintenance contract
    customer.hasMaintenanceContract = true;
    if (newStartDate) customer.maintenanceStartDate = newStartDate;
    if (newEndDate) customer.maintenanceEndDate = newEndDate;
    
    // Add reactivation notes
    customer.reactivationNotes = notes;
    customer.reactivatedAt = new Date();
    
    await customer.save();

    res.json({ 
      msg: `${customer.company} için bakım anlaşması yeniden aktifleştirildi`,
      customer
    });
  } catch (error) {
    console.error('Maintenance reactivation error:', error);
    res.status(500).json({ msg: 'Yeniden aktifleştirme başarısız', error: error.message });
  }
});

// Get maintenance statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const now = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    const stats = await Customer.aggregate([
      {
        $facet: {
          active: [
            { 
              $match: { 
                hasMaintenanceContract: true,
                maintenanceEndDate: { $gt: now }
              }
            },
            { $count: "count" }
          ],
          inactive: [
            { 
              $match: { 
                $or: [
                  { hasMaintenanceContract: false },
                  { 
                    hasMaintenanceContract: true,
                    maintenanceEndDate: { $lt: now }
                  }
                ]
              }
            },
            { $count: "count" }
          ],
          expiringThisMonth: [
            { 
              $match: { 
                hasMaintenanceContract: true,
                maintenanceEndDate: { 
                  $gte: now,
                  $lte: oneMonthFromNow 
                }
              }
            },
            { $count: "count" }
          ],
          expiringThreeMonths: [
            { 
              $match: { 
                hasMaintenanceContract: true,
                maintenanceEndDate: { 
                  $gte: now,
                  $lte: threeMonthsFromNow 
                }
              }
            },
            { $count: "count" }
          ]
        }
      }
    ]);

    const result = {
      active: stats[0].active[0]?.count || 0,
      inactive: stats[0].inactive[0]?.count || 0,
      expiringThisMonth: stats[0].expiringThisMonth[0]?.count || 0,
      expiringThreeMonths: stats[0].expiringThreeMonths[0]?.count || 0
    };

    res.json(result);
  } catch (error) {
    console.error('Maintenance stats error:', error);
    res.status(500).json({ msg: 'Bakım istatistikleri getirilemedi', error: error.message });
  }
});

module.exports = router;

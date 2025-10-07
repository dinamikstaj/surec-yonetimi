// routes/serviceJobRoutes.js

const express = require('express');
const router = express.Router();
const ServiceJob = require('../models/ServiceJob');
const Customer = require('../models/Customer');
const User = require('../models/User');
const Technician = require('../models/Technician');

// Get all service jobs with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      serviceType, 
      technician, 
      customer, 
      startDate, 
      endDate,
      city,
      search 
    } = req.query;

    let query = {};

    // Build filter query
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (serviceType) query.serviceType = serviceType;
    if (technician) query.assignedTechnician = technician;
    if (customer) query.customer = customer;
    if (city) query['location.city'] = new RegExp(city, 'i');

    // Date range filter
    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate);
      if (endDate) query.scheduledDate.$lte = new Date(endDate);
    }

    let serviceJobs = await ServiceJob.find(query)
      .populate('customer', 'company name email phone city')
      .populate('assignedTechnician', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ scheduledDate: -1 });

    // Search filter (applied after population)
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      serviceJobs = serviceJobs.filter(job => 
        searchRegex.test(job.jobNumber) ||
        searchRegex.test(job.customer.company) ||
        searchRegex.test(job.customer.name) ||
        searchRegex.test(job.description) ||
        searchRegex.test(job.location.city)
      );
    }

    res.json(serviceJobs);
  } catch (error) {
    console.error('Service jobs fetch error:', error);
    res.status(500).json({ msg: 'Servis işleri getirilemedi', error: error.message });
  }
});

// Get single service job
router.get('/:id', async (req, res) => {
  try {
    const serviceJob = await ServiceJob.findById(req.params.id)
      .populate('customer', 'company name email phone city address')
      .populate('assignedTechnician', 'name email avatar')
      .populate('createdBy', 'name email');

    if (!serviceJob) {
      return res.status(404).json({ msg: 'Servis işi bulunamadı' });
    }

    res.json(serviceJob);
  } catch (error) {
    console.error('Service job fetch error:', error);
    res.status(500).json({ msg: 'Servis işi getirilemedi', error: error.message });
  }
});

// Create new service job
router.post('/', async (req, res) => {
  try {
    const {
      customer,
      serviceType,
      priority,
      scheduledDate,
      estimatedDuration,
      description,
      location,
      equipment,
      cost,
      assignedTechnician,
      notes
    } = req.body;

    // Validate required fields
    if (!customer || !serviceType || !scheduledDate || !estimatedDuration || !description || !location || !cost) {
      return res.status(400).json({ msg: 'Gerekli alanlar eksik' });
    }

    // Verify customer exists
    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(404).json({ msg: 'Müşteri bulunamadı' });
    }

    // Verify technician exists if assigned
    if (assignedTechnician) {
      const techExists = await User.findById(assignedTechnician);
      if (!techExists) {
        return res.status(404).json({ msg: 'Teknisyen bulunamadı' });
      }
    }

    const serviceJob = new ServiceJob({
      customer,
      serviceType,
      priority: priority || 'medium',
      scheduledDate,
      estimatedDuration,
      description,
      location,
      equipment: equipment || [],
      cost,
      assignedTechnician,
      notes,
      createdBy: req.user?.id || '507f1f77bcf86cd799439011' // Default user ID
    });

    await serviceJob.save();

    // Populate before sending response
    await serviceJob.populate('customer', 'company name email phone city');
    await serviceJob.populate('assignedTechnician', 'name email avatar');

    res.status(201).json(serviceJob);
  } catch (error) {
    console.error('Service job creation error:', error);
    res.status(500).json({ msg: 'Servis işi oluşturulamadı', error: error.message });
  }
});

// Update service job status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ msg: 'Durum belirtilmeli' });
    }

    const validStatuses = ['scheduled', 'in-progress', 'completed', 'cancelled', 'on-hold'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ msg: 'Geçersiz durum' });
    }

    const serviceJob = await ServiceJob.findById(req.params.id);
    if (!serviceJob) {
      return res.status(404).json({ msg: 'Servis işi bulunamadı' });
    }

    serviceJob.status = status;
    
    // Set completion time if completed
    if (status === 'completed' && !serviceJob.completedAt) {
      serviceJob.completedAt = new Date();
    }

    await serviceJob.save();

    // Populate before sending response
    await serviceJob.populate('customer', 'company name email phone');
    await serviceJob.populate('assignedTechnician', 'name email');

    res.json(serviceJob);
  } catch (error) {
    console.error('Service job status update error:', error);
    res.status(500).json({ msg: 'Durum güncellenemedi', error: error.message });
  }
});

// Update service job
router.put('/:id', async (req, res) => {
  try {
    const serviceJob = await ServiceJob.findById(req.params.id);
    if (!serviceJob) {
      return res.status(404).json({ msg: 'Servis işi bulunamadı' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        serviceJob[key] = req.body[key];
      }
    });

    await serviceJob.save();

    // Populate before sending response
    await serviceJob.populate('customer', 'company name email phone city');
    await serviceJob.populate('assignedTechnician', 'name email avatar');

    res.json(serviceJob);
  } catch (error) {
    console.error('Service job update error:', error);
    res.status(500).json({ msg: 'Servis işi güncellenemedi', error: error.message });
  }
});

// Delete service job
router.delete('/:id', async (req, res) => {
  try {
    const serviceJob = await ServiceJob.findById(req.params.id);
    if (!serviceJob) {
      return res.status(404).json({ msg: 'Servis işi bulunamadı' });
    }

    await ServiceJob.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Servis işi silindi' });
  } catch (error) {
    console.error('Service job deletion error:', error);
    res.status(500).json({ msg: 'Servis işi silinemedi', error: error.message });
  }
});

// Get service job statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await ServiceJob.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          scheduled: { $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          onHold: { $sum: { $cond: [{ $eq: ['$status', 'on-hold'] }, 1, 0] } },
          totalRevenue: { 
            $sum: { 
              $cond: [
                { $eq: ['$status', 'completed'] },
                { $ifNull: ['$cost.actual', '$cost.estimated'] },
                0
              ]
            }
          },
          avgDuration: { $avg: '$actualDuration' }
        }
      }
    ]);

    // Calculate overdue jobs
    const now = new Date();
    const overdueJobs = await ServiceJob.countDocuments({
      scheduledDate: { $lt: now },
      status: { $nin: ['completed', 'cancelled'] }
    });

    const result = stats[0] || {
      total: 0,
      scheduled: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      onHold: 0,
      totalRevenue: 0,
      avgDuration: 0
    };

    result.overdue = overdueJobs;
    result.completionRate = result.total > 0 ? (result.completed / result.total) * 100 : 0;

    res.json(result);
  } catch (error) {
    console.error('Service job stats error:', error);
    res.status(500).json({ msg: 'İstatistikler getirilemedi', error: error.message });
  }
});

module.exports = router;

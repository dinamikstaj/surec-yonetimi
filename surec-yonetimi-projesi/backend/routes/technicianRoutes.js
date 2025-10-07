// routes/technicianRoutes.js

const express = require('express');
const router = express.Router();
const Technician = require('../models/Technician');
const User = require('../models/User');
const ServiceJob = require('../models/ServiceJob');

// Get all technicians
router.get('/', async (req, res) => {
  try {
    const technicians = await Technician.find({ isActive: true })
      .populate('user', 'name email avatar phone')
      .sort({ 'performance.rating': -1 });

    // Transform data to include user details at root level
    const transformedTechnicians = technicians.map(tech => ({
      _id: tech._id,
      name: tech.user.name,
      email: tech.user.email,
      avatar: tech.user.avatar,
      phone: tech.user.phone,
      employeeId: tech.employeeId,
      specialization: tech.specialization,
      rating: tech.performance.rating,
      currentJobs: tech.currentJobs,
      maxConcurrentJobs: tech.maxConcurrentJobs,
      availability: tech.availability,
      performance: tech.performance,
      certifications: tech.certifications,
      location: tech.location
    }));

    res.json(transformedTechnicians);
  } catch (error) {
    console.error('Technicians fetch error:', error);
    res.status(500).json({ msg: 'Teknisyenler getirilemedi', error: error.message });
  }
});

// Get single technician
router.get('/:id', async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.id)
      .populate('user', 'name email avatar phone');

    if (!technician) {
      return res.status(404).json({ msg: 'Teknisyen bulunamadı' });
    }

    // Get technician's current jobs
    const currentJobs = await ServiceJob.find({
      assignedTechnician: technician.user._id,
      status: { $in: ['scheduled', 'in-progress'] }
    }).populate('customer', 'company name');

    const result = {
      _id: technician._id,
      name: technician.user.name,
      email: technician.user.email,
      avatar: technician.user.avatar,
      phone: technician.user.phone,
      employeeId: technician.employeeId,
      specialization: technician.specialization,
      rating: technician.performance.rating,
      currentJobs: technician.currentJobs,
      maxConcurrentJobs: technician.maxConcurrentJobs,
      availability: technician.availability,
      performance: technician.performance,
      certifications: technician.certifications,
      location: technician.location,
      activeJobs: currentJobs
    };

    res.json(result);
  } catch (error) {
    console.error('Technician fetch error:', error);
    res.status(500).json({ msg: 'Teknisyen getirilemedi', error: error.message });
  }
});

// Create new technician
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      employeeId,
      specialization,
      certifications,
      experience,
      availability,
      maxConcurrentJobs,
      location,
      contact
    } = req.body;

    // Validate required fields
    if (!userId || !employeeId || !specialization) {
      return res.status(400).json({ msg: 'Gerekli alanlar eksik' });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'Kullanıcı bulunamadı' });
    }

    // Check if technician already exists for this user
    const existingTech = await Technician.findOne({ user: userId });
    if (existingTech) {
      return res.status(400).json({ msg: 'Bu kullanıcı için teknisyen kaydı zaten mevcut' });
    }

    const technician = new Technician({
      user: userId,
      employeeId,
      specialization,
      certifications: certifications || [],
      experience: experience || { years: 0, previousCompanies: [] },
      availability: availability || {
        status: 'available',
        workingHours: { start: '09:00', end: '17:00' },
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      },
      maxConcurrentJobs: maxConcurrentJobs || 3,
      location: location || {},
      contact: contact || {}
    });

    await technician.save();
    await technician.populate('user', 'name email avatar phone');

    res.status(201).json(technician);
  } catch (error) {
    console.error('Technician creation error:', error);
    res.status(500).json({ msg: 'Teknisyen oluşturulamadı', error: error.message });
  }
});

// Update technician
router.put('/:id', async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.id);
    if (!technician) {
      return res.status(404).json({ msg: 'Teknisyen bulunamadı' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== 'user') {
        technician[key] = req.body[key];
      }
    });

    await technician.save();
    await technician.populate('user', 'name email avatar phone');

    res.json(technician);
  } catch (error) {
    console.error('Technician update error:', error);
    res.status(500).json({ msg: 'Teknisyen güncellenemedi', error: error.message });
  }
});

// Update technician availability
router.patch('/:id/availability', async (req, res) => {
  try {
    const { status, workingHours, workingDays } = req.body;

    const technician = await Technician.findById(req.params.id);
    if (!technician) {
      return res.status(404).json({ msg: 'Teknisyen bulunamadı' });
    }

    if (status) technician.availability.status = status;
    if (workingHours) technician.availability.workingHours = workingHours;
    if (workingDays) technician.availability.workingDays = workingDays;

    await technician.save();
    await technician.populate('user', 'name email avatar');

    res.json(technician);
  } catch (error) {
    console.error('Technician availability update error:', error);
    res.status(500).json({ msg: 'Müsaitlik durumu güncellenemedi', error: error.message });
  }
});

// Get technician statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const technicianId = req.params.id;
    
    // Get technician's user ID
    const technician = await Technician.findById(technicianId).populate('user');
    if (!technician) {
      return res.status(404).json({ msg: 'Teknisyen bulunamadı' });
    }

    const userId = technician.user._id;

    // Get job statistics
    const jobStats = await ServiceJob.aggregate([
      { $match: { assignedTechnician: userId } },
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          completedJobs: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelledJobs: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
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

    const stats = jobStats[0] || {
      totalJobs: 0,
      completedJobs: 0,
      cancelledJobs: 0,
      totalRevenue: 0,
      avgDuration: 0
    };

    stats.completionRate = stats.totalJobs > 0 ? (stats.completedJobs / stats.totalJobs) * 100 : 0;

    res.json(stats);
  } catch (error) {
    console.error('Technician stats error:', error);
    res.status(500).json({ msg: 'Teknisyen istatistikleri getirilemedi', error: error.message });
  }
});

// Delete technician
router.delete('/:id', async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.id);
    if (!technician) {
      return res.status(404).json({ msg: 'Teknisyen bulunamadı' });
    }

    // Check if technician has active jobs
    const activeJobs = await ServiceJob.countDocuments({
      assignedTechnician: technician.user,
      status: { $in: ['scheduled', 'in-progress'] }
    });

    if (activeJobs > 0) {
      return res.status(400).json({ 
        msg: 'Aktif işleri olan teknisyen silinemez',
        activeJobs 
      });
    }

    // Soft delete - mark as inactive
    technician.isActive = false;
    await technician.save();

    res.json({ msg: 'Teknisyen pasifleştirildi' });
  } catch (error) {
    console.error('Technician deletion error:', error);
    res.status(500).json({ msg: 'Teknisyen silinemedi', error: error.message });
  }
});

module.exports = router;

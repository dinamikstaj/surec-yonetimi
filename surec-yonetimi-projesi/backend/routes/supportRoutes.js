// routes/supportRoutes.js

const express = require('express');
const router = express.Router();
const SupportRequest = require('../models/SupportRequest');
const OnsiteSupport = require('../models/OnsiteSupport');
const RemoteSupport = require('../models/RemoteSupport');
const MaintenanceSupport = require('../models/MaintenanceSupport');
const Customer = require('../models/Customer');
const User = require('../models/User');

// Get pending support requests
router.get('/pending', async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      requestType, 
      evaluator, 
      customer,
      search 
    } = req.query;

    let query = {};

    // Build filter query
    if (status) query.evaluationStatus = status;
    if (priority) query.priority = priority;
    if (requestType) query.requestType = requestType;
    if (evaluator) query.assignedEvaluator = evaluator;
    if (customer) query.customer = customer;

    let supportRequests = await SupportRequest.find(query)
      .populate('customer', 'company name email phone city address')
      .populate('assignedEvaluator', 'name email avatar')
      .sort({ submittedDate: -1 });

    // Search filter (applied after population)
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      supportRequests = supportRequests.filter(request => 
        searchRegex.test(request.requestNumber) ||
        searchRegex.test(request.customer.company) ||
        searchRegex.test(request.customer.name) ||
        searchRegex.test(request.description)
      );
    }

    // Transform data to match frontend interface
    const transformedRequests = supportRequests.map(request => ({
      _id: request._id,
      company: request.customer.company,
      name: request.customer.name,
      email: request.customer.email,
      phone: request.customer.phone,
      address: request.customer.address,
      city: request.customer.city,
      supportRequest: {
        submittedDate: request.submittedDate,
        requestType: request.requestType,
        priority: request.priority,
        description: request.description,
        estimatedValue: request.estimatedValue,
        requiredResources: request.requiredResources
      },
      evaluationStatus: request.evaluationStatus,
      assignedEvaluator: request.assignedEvaluator,
      evaluationNotes: request.evaluationNotes,
      riskAssessment: request.riskAssessment,
      businessImpact: request.businessImpact,
      decisionDeadline: request.decisionDeadline,
      createdAt: request.createdAt
    }));

    res.json(transformedRequests);
  } catch (error) {
    console.error('Pending support requests fetch error:', error);
    res.status(500).json({ msg: 'Bekleyen destek talepleri getirilemedi', error: error.message });
  }
});

// Get active support customers
router.get('/active', async (req, res) => {
  try {
    // Get customers with approved support requests
    const approvedRequests = await SupportRequest.find({ 
      evaluationStatus: 'approved' 
    }).populate('customer', 'company name email phone city address hasMaintenanceContract hasServiceContract');

    // Transform to customer format
    const activeCustomers = approvedRequests.map(request => ({
      _id: request.customer._id,
      company: request.customer.company,
      name: request.customer.name,
      email: request.customer.email,
      phone: request.customer.phone,
      city: request.customer.city,
      address: request.customer.address,
      hasMaintenanceContract: request.customer.hasMaintenanceContract,
      hasServiceContract: request.customer.hasServiceContract,
      supportRequest: {
        _id: request._id,
        requestNumber: request.requestNumber,
        requestType: request.requestType,
        priority: request.priority,
        estimatedValue: request.estimatedValue,
        approvedAt: request.approvedAt
      },
      createdAt: request.customer.createdAt || request.createdAt
    }));

    res.json(activeCustomers);
  } catch (error) {
    console.error('Active support fetch error:', error);
    res.status(500).json({ msg: 'Aktif destek müşterileri getirilemedi', error: error.message });
  }
});

// Get inactive support customers
router.get('/inactive', async (req, res) => {
  try {
    // Get customers with rejected support requests or no requests
    const rejectedRequests = await SupportRequest.find({ 
      evaluationStatus: 'rejected' 
    }).populate('customer', 'company name email phone city address');

    // Transform to customer format
    const inactiveCustomers = rejectedRequests.map(request => ({
      _id: request.customer._id,
      company: request.customer.company,
      name: request.customer.name,
      email: request.customer.email,
      phone: request.customer.phone,
      city: request.customer.city,
      address: request.customer.address,
      exclusionReason: request.rejectionReason || 'other',
      exclusionDate: request.rejectedAt,
      exclusionNotes: request.evaluationNotes,
      lastSupportDate: request.submittedDate,
      potentialValue: request.estimatedValue,
      riskLevel: request.riskAssessment || 'medium',
      canReactivate: true,
      createdAt: request.createdAt
    }));

    res.json(inactiveCustomers);
  } catch (error) {
    console.error('Inactive support fetch error:', error);
    res.status(500).json({ msg: 'Pasif destek müşterileri getirilemedi', error: error.message });
  }
});

// Create new support request
router.post('/request', async (req, res) => {
  try {
    const {
      customer,
      requestType,
      priority,
      description,
      estimatedValue,
      requiredResources,
      decisionDeadline
    } = req.body;

    // Validate required fields
    if (!customer || !requestType || !description || !estimatedValue) {
      return res.status(400).json({ msg: 'Gerekli alanlar eksik' });
    }

    // Verify customer exists
    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(404).json({ msg: 'Müşteri bulunamadı' });
    }

    const supportRequest = new SupportRequest({
      customer,
      requestType,
      priority: priority || 'medium',
      description,
      estimatedValue,
      requiredResources: requiredResources || [],
      decisionDeadline: decisionDeadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days default
    });

    await supportRequest.save();
    await supportRequest.populate('customer', 'company name email phone');

    res.status(201).json(supportRequest);
  } catch (error) {
    console.error('Support request creation error:', error);
    res.status(500).json({ msg: 'Destek talebi oluşturulamadı', error: error.message });
  }
});

// Approve support request
router.post('/pending/:id/approve', async (req, res) => {
  try {
    const { notes } = req.body;
    const requestId = req.params.id;

    const supportRequest = await SupportRequest.findById(requestId);
    if (!supportRequest) {
      return res.status(404).json({ msg: 'Destek talebi bulunamadı' });
    }

    supportRequest.evaluationStatus = 'approved';
    supportRequest.evaluationNotes = notes;
    supportRequest.approvedAt = new Date();
    supportRequest.approvedBy = req.user?.id || '507f1f77bcf86cd799439011'; // Default user ID

    await supportRequest.save();
    await supportRequest.populate('customer', 'company name email');

    res.json({ 
      msg: 'Destek talebi onaylandı',
      supportRequest 
    });
  } catch (error) {
    console.error('Support request approval error:', error);
    res.status(500).json({ msg: 'Onaylama işlemi başarısız', error: error.message });
  }
});

// Reject support request
router.post('/pending/:id/reject', async (req, res) => {
  try {
    const { notes } = req.body;
    const requestId = req.params.id;

    if (!notes || notes.trim() === '') {
      return res.status(400).json({ msg: 'Reddetme gerekçesi yazılmalı' });
    }

    const supportRequest = await SupportRequest.findById(requestId);
    if (!supportRequest) {
      return res.status(404).json({ msg: 'Destek talebi bulunamadı' });
    }

    supportRequest.evaluationStatus = 'rejected';
    supportRequest.evaluationNotes = notes;
    supportRequest.rejectionReason = notes;
    supportRequest.rejectedAt = new Date();
    supportRequest.rejectedBy = req.user?.id || '507f1f77bcf86cd799439011'; // Default user ID

    await supportRequest.save();
    await supportRequest.populate('customer', 'company name email');

    res.json({ 
      msg: 'Destek talebi reddedildi',
      supportRequest 
    });
  } catch (error) {
    console.error('Support request rejection error:', error);
    res.status(500).json({ msg: 'Reddetme işlemi başarısız', error: error.message });
  }
});

// Get support statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await SupportRequest.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          submitted: { $sum: { $cond: [{ $eq: ['$evaluationStatus', 'submitted'] }, 1, 0] } },
          underReview: { $sum: { $cond: [{ $eq: ['$evaluationStatus', 'under-review'] }, 1, 0] } },
          pendingApproval: { $sum: { $cond: [{ $eq: ['$evaluationStatus', 'pending-approval'] }, 1, 0] } },
          approved: { $sum: { $cond: [{ $eq: ['$evaluationStatus', 'approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$evaluationStatus', 'rejected'] }, 1, 0] } },
          totalValue: { $sum: '$estimatedValue' }
        }
      }
    ]);

    // Calculate overdue requests
    const now = new Date();
    const overdueRequests = await SupportRequest.countDocuments({
      decisionDeadline: { $lt: now },
      evaluationStatus: { $nin: ['approved', 'rejected'] }
    });

    const result = stats[0] || {
      total: 0,
      submitted: 0,
      underReview: 0,
      pendingApproval: 0,
      approved: 0,
      rejected: 0,
      totalValue: 0
    };

    result.overdue = overdueRequests;

    res.json(result);
  } catch (error) {
    console.error('Support stats error:', error);
    res.status(500).json({ msg: 'Destek istatistikleri getirilemedi', error: error.message });
  }
});

// Get onsite support requests
router.get('/onsite', async (req, res) => {
  try {
    const onsiteSupports = await OnsiteSupport.find()
      .populate('customer', 'company name email phone city address')
      .populate('assignedTechnician', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(onsiteSupports);
  } catch (error) {
    console.error('Onsite support fetch error:', error);
    res.status(500).json({ msg: 'Yerinde destek talepleri getirilemedi', error: error.message });
  }
});

// Get remote support requests
router.get('/remote', async (req, res) => {
  try {
    const remoteSupports = await RemoteSupport.find()
      .populate('customer', 'company name email phone city')
      .populate('assignedTechnician', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(remoteSupports);
  } catch (error) {
    console.error('Remote support fetch error:', error);
    res.status(500).json({ msg: 'Uzaktan destek talepleri getirilemedi', error: error.message });
  }
});

// Get maintenance support requests
router.get('/maintenance-support', async (req, res) => {
  try {
    const maintenanceSupports = await MaintenanceSupport.find()
      .populate('customer', 'company name email phone city hasMaintenanceContract maintenanceEndDate')
      .populate('assignedTechnician', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(maintenanceSupports);
  } catch (error) {
    console.error('Maintenance support fetch error:', error);
    res.status(500).json({ msg: 'Bakım destek talepleri getirilemedi', error: error.message });
  }
});

// Get all support requests (combined)
router.get('/all-requests', async (req, res) => {
  try {
    // Fetch all three types of support requests
    const [onsiteSupports, remoteSupports, maintenanceSupports] = await Promise.all([
      OnsiteSupport.find()
        .populate('customer', 'company name email phone city')
        .populate('assignedTechnician', 'name email avatar')
        .lean(),
      RemoteSupport.find()
        .populate('customer', 'company name email phone city')
        .populate('assignedTechnician', 'name email avatar')
        .lean(),
      MaintenanceSupport.find()
        .populate('customer', 'company name email phone city')
        .populate('assignedTechnician', 'name email avatar')
        .lean()
    ]);

    // Add category field to each support type
    const onsiteWithCategory = onsiteSupports.map(s => ({
      ...s,
      supportCategory: 'onsite',
      location: s.location ? { city: s.location.city, address: s.location.address } : undefined
    }));

    const remoteWithCategory = remoteSupports.map(s => ({
      ...s,
      supportCategory: 'remote'
    }));

    const maintenanceWithCategory = maintenanceSupports.map(s => ({
      ...s,
      supportCategory: 'maintenance',
      supportType: s.maintenanceType
    }));

    // Combine all supports and sort by creation date
    const allSupports = [...onsiteWithCategory, ...remoteWithCategory, ...maintenanceWithCategory]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(allSupports);
  } catch (error) {
    console.error('All support requests fetch error:', error);
    res.status(500).json({ msg: 'Tüm destek talepleri getirilemedi', error: error.message });
  }
});

// Create new onsite support
router.post('/onsite', async (req, res) => {
  try {
    const {
      customer,
      supportType,
      priority,
      scheduledDate,
      estimatedDuration,
      description,
      location,
      equipment,
      cost,
      travelInfo,
      notes,
      assignedTechnician
    } = req.body;

    // Validate required fields
    if (!customer || !supportType || !scheduledDate || !estimatedDuration || !description || !location || !cost) {
      return res.status(400).json({ msg: 'Gerekli alanlar eksik' });
    }

    // Verify customer exists and has service contract
    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(404).json({ msg: 'Müşteri bulunamadı' });
    }

    if (!customerExists.hasServiceContract) {
      return res.status(403).json({ msg: 'Müşterinin servis anlaşması bulunmuyor' });
    }

    // Verify technician if assigned
    if (assignedTechnician) {
      const techExists = await User.findById(assignedTechnician);
      if (!techExists) {
        return res.status(404).json({ msg: 'Teknisyen bulunamadı' });
      }
    }

    const onsiteSupport = new OnsiteSupport({
      customer,
      supportType,
      priority: priority || 'medium',
      status: 'requested',
      scheduledDate,
      estimatedDuration,
      description,
      location,
      equipment: equipment || [],
      cost,
      travelInfo: travelInfo || {},
      notes,
      assignedTechnician
    });

    await onsiteSupport.save();

    // Populate before sending response
    await onsiteSupport.populate('customer', 'company name email phone city');
    await onsiteSupport.populate('assignedTechnician', 'name email avatar');

    res.status(201).json(onsiteSupport);
  } catch (error) {
    console.error('Onsite support creation error:', error);
    res.status(500).json({ msg: 'Yerinde destek talebi oluşturulamadı', error: error.message });
  }
});

// Update onsite support status
router.patch('/onsite/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const support = await OnsiteSupport.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        ...(status === 'completed' && { completedAt: new Date() })
      },
      { new: true }
    ).populate('customer assignedTechnician');

    if (!support) {
      return res.status(404).json({ msg: 'Destek kaydı bulunamadı' });
    }

    res.json(support);
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ msg: 'Durum güncellenemedi', error: error.message });
  }
});

// Update remote support status
router.patch('/remote/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const support = await RemoteSupport.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        ...(status === 'completed' && { completedAt: new Date() })
      },
      { new: true }
    ).populate('customer assignedTechnician');

    if (!support) {
      return res.status(404).json({ msg: 'Destek kaydı bulunamadı' });
    }

    res.json(support);
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ msg: 'Durum güncellenemedi', error: error.message });
  }
});

// Update maintenance support status
router.patch('/maintenance-support/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const support = await MaintenanceSupport.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        ...(status === 'completed' && { completedAt: new Date() })
      },
      { new: true }
    ).populate('customer assignedTechnician');

    if (!support) {
      return res.status(404).json({ msg: 'Bakım kaydı bulunamadı' });
    }

    res.json(support);
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ msg: 'Durum güncellenemedi', error: error.message });
  }
});

module.exports = router;

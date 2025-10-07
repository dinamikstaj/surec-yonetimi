// models/SupportRequest.js

const mongoose = require('mongoose');

const SupportRequestSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  requestNumber: {
    type: String,
    required: true,
    unique: true
  },
  requestType: {
    type: String,
    enum: ['technical', 'financial', 'operational', 'strategic'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  description: {
    type: String,
    required: true
  },
  estimatedValue: {
    type: Number,
    required: true
  },
  requiredResources: [{
    type: String
  }],
  submittedDate: {
    type: Date,
    default: Date.now
  },
  evaluationStatus: {
    type: String,
    enum: ['submitted', 'under-review', 'pending-approval', 'approved', 'rejected'],
    default: 'submitted'
  },
  assignedEvaluator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  evaluationNotes: {
    type: String
  },
  riskAssessment: {
    type: String,
    enum: ['low', 'medium', 'high']
  },
  businessImpact: {
    type: String,
    enum: ['minimal', 'moderate', 'significant', 'critical']
  },
  decisionDeadline: {
    type: Date
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String
  },
  attachments: [{
    filename: String,
    path: String,
    mimetype: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  followUpActions: [{
    action: String,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dueDate: Date,
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }]
}, {
  timestamps: true
});

// Auto-generate request number
SupportRequestSchema.pre('save', async function(next) {
  if (this.isNew && !this.requestNumber) {
    const count = await mongoose.model('SupportRequest').countDocuments();
    const year = new Date().getFullYear();
    this.requestNumber = `SR${year}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Update approval/rejection timestamps
SupportRequestSchema.pre('save', function(next) {
  if (this.isModified('evaluationStatus')) {
    if (this.evaluationStatus === 'approved' && !this.approvedAt) {
      this.approvedAt = new Date();
    } else if (this.evaluationStatus === 'rejected' && !this.rejectedAt) {
      this.rejectedAt = new Date();
    }
  }
  next();
});

// Indexes
SupportRequestSchema.index({ customer: 1 });
SupportRequestSchema.index({ evaluationStatus: 1 });
SupportRequestSchema.index({ submittedDate: -1 });
SupportRequestSchema.index({ decisionDeadline: 1 });
SupportRequestSchema.index({ assignedEvaluator: 1 });
SupportRequestSchema.index({ requestType: 1 });
SupportRequestSchema.index({ priority: 1 });

module.exports = mongoose.model('SupportRequest', SupportRequestSchema);

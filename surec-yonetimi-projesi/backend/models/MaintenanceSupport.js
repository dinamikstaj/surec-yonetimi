const mongoose = require('mongoose');

const maintenanceSupportSchema = new mongoose.Schema({
  supportNumber: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return `MS${Date.now()}`;
    }
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  maintenanceType: {
    type: String,
    enum: ['preventive', 'corrective', 'predictive', 'emergency', 'scheduled'],
    default: 'preventive'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'rescheduled'],
    default: 'scheduled'
  },
  assignedTechnician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  estimatedDuration: {
    type: Number, // hours
    required: true
  },
  actualDuration: {
    type: Number // hours
  },
  description: {
    type: String,
    required: true
  },
  maintenanceItems: [{
    item: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    notes: String
  }],
  cost: {
    estimated: { type: Number, required: true },
    actual: Number,
    parts: Number,
    currency: { type: String, default: 'TRY' }
  },
  contractInfo: {
    contractId: String,
    remainingVisits: Number,
    totalVisits: Number,
    contractEndDate: Date
  },
  equipmentChecked: [String],
  issuesFound: [String],
  recommendations: [String],
  nextMaintenanceDate: Date,
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp before save
maintenanceSupportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('MaintenanceSupport', maintenanceSupportSchema);


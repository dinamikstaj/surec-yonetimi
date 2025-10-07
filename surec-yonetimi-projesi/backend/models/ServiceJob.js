// models/ServiceJob.js

const mongoose = require('mongoose');

const ServiceJobSchema = new mongoose.Schema({
  jobNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  serviceType: {
    type: String,
    enum: ['installation', 'maintenance', 'repair', 'upgrade', 'consultation'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'on-hold'],
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
  location: {
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  equipment: [{
    type: String
  }],
  cost: {
    estimated: {
      type: Number,
      required: true
    },
    actual: {
      type: Number
    },
    currency: {
      type: String,
      default: 'TRY'
    }
  },
  notes: {
    type: String
  },
  photos: [{
    type: String // file paths
  }],
  customerSignature: {
    type: String // base64 or file path
  },
  completedAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Auto-generate job number
ServiceJobSchema.pre('save', async function(next) {
  if (this.isNew && !this.jobNumber) {
    const count = await mongoose.model('ServiceJob').countDocuments();
    const year = new Date().getFullYear();
    this.jobNumber = `SJ${year}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Update completedAt when status changes to completed
ServiceJobSchema.pre('save', function(next) {
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

// Indexes for better query performance
ServiceJobSchema.index({ status: 1 });
ServiceJobSchema.index({ scheduledDate: 1 });
ServiceJobSchema.index({ assignedTechnician: 1 });
ServiceJobSchema.index({ customer: 1 });
ServiceJobSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ServiceJob', ServiceJobSchema);

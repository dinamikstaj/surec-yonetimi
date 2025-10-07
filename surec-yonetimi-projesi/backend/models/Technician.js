// models/Technician.js

const mongoose = require('mongoose');

const TechnicianSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  specialization: [{
    type: String,
    enum: [
      'network-installation',
      'hardware-repair', 
      'software-installation',
      'system-maintenance',
      'security-systems',
      'telecommunications',
      'server-management',
      'database-administration',
      'cloud-services',
      'mobile-device-support'
    ]
  }],
  certifications: [{
    name: String,
    issuer: String,
    issueDate: Date,
    expiryDate: Date,
    certificateNumber: String
  }],
  experience: {
    years: {
      type: Number,
      default: 0
    },
    previousCompanies: [{
      company: String,
      position: String,
      startDate: Date,
      endDate: Date
    }]
  },
  performance: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    completedJobs: {
      type: Number,
      default: 0
    },
    averageCompletionTime: {
      type: Number, // hours
      default: 0
    },
    customerSatisfactionScore: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    }
  },
  availability: {
    status: {
      type: String,
      enum: ['available', 'busy', 'on-leave', 'off-duty'],
      default: 'available'
    },
    workingHours: {
      start: {
        type: String,
        default: '09:00'
      },
      end: {
        type: String,
        default: '17:00'
      }
    },
    workingDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  },
  currentJobs: {
    type: Number,
    default: 0
  },
  maxConcurrentJobs: {
    type: Number,
    default: 3
  },
  location: {
    city: String,
    region: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  contact: {
    emergencyPhone: String,
    workPhone: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for getting user details
TechnicianSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

// Ensure virtual fields are serialized
TechnicianSchema.set('toJSON', { virtuals: true });

// Indexes
TechnicianSchema.index({ user: 1 });
TechnicianSchema.index({ specialization: 1 });
TechnicianSchema.index({ 'availability.status': 1 });
TechnicianSchema.index({ 'performance.rating': -1 });
TechnicianSchema.index({ currentJobs: 1 });

module.exports = mongoose.model('Technician', TechnicianSchema);

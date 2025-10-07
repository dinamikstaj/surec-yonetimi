const mongoose = require('mongoose');

const remoteSupportSchema = new mongoose.Schema({
  supportNumber: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return `RS${Date.now()}`;
    }
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  supportType: {
    type: String,
    enum: ['remote-access', 'phone-support', 'email-support', 'video-call', 'screen-sharing'],
    default: 'remote-access'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['requested', 'in-progress', 'completed', 'cancelled', 'waiting-customer'],
    default: 'requested'
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
  remoteAccessInfo: {
    platform: {
      type: String,
      enum: ['teamviewer', 'anydesk', 'rdp', 'vnc', 'custom']
    },
    connectionId: String,
    password: String,
    port: Number
  },
  communicationChannel: {
    type: String,
    enum: ['phone', 'email', 'teams', 'zoom', 'whatsapp'],
    default: 'phone'
  },
  cost: {
    estimated: { type: Number, required: true },
    actual: Number,
    currency: { type: String, default: 'TRY' }
  },
  sessionLogs: [{
    startTime: Date,
    endTime: Date,
    duration: Number, // minutes
    activities: [String]
  }],
  notes: String,
  customerFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String
  },
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
remoteSupportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('RemoteSupport', remoteSupportSchema);


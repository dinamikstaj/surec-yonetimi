const mongoose = require('mongoose');

const onsiteSupportSchema = new mongoose.Schema({
  supportNumber: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return `OS${Date.now()}`;
    }
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  supportType: {
    type: String,
    enum: ['installation', 'maintenance', 'repair', 'training', 'consultation'],
    default: 'maintenance'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['requested', 'scheduled', 'in-progress', 'completed', 'cancelled'],
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
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    floor: String,
    room: String,
    contactPerson: String,
    contactPhone: String
  },
  equipment: [String],
  cost: {
    estimated: { type: Number, required: true },
    actual: Number,
    travelCost: Number,
    currency: { type: String, default: 'TRY' }
  },
  travelInfo: {
    distance: Number, // km
    estimatedTravelTime: Number, // minutes
    transportType: {
      type: String,
      enum: ['car', 'public', 'flight']
    }
  },
  notes: String,
  photos: [String],
  completionReport: String,
  customerSignature: String,
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
onsiteSupportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('OnsiteSupport', onsiteSupportSchema);


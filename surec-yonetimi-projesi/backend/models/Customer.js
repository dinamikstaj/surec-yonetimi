const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  vkn: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  district: {
    type: String,
    required: true,
    trim: true
  },
  postalCode: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    default: 'Türkiye',
    trim: true
  },
  authorizedPerson: {
    name: {
      type: String,
      trim: true
    },
    title: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  branches: [{
    name: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    district: {
      type: String,
      trim: true
    },
    postalCode: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    authorizedPerson: {
      name: {
        type: String,
        trim: true
      },
      title: {
        type: String,
        trim: true
      },
      phone: {
        type: String,
        trim: true
      },
      email: {
        type: String,
        trim: true,
        lowercase: true
      }
    },
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  hasMaintenanceContract: {
    type: Boolean,
    default: false
  },
  maintenanceStartDate: {
    type: Date
  },
  maintenanceEndDate: {
    type: Date
  },
  maintenanceValue: {
    type: Number
  },
  renewalValue: {
    type: Number
  },
  lastContactDate: {
    type: Date
  },
  remindersSent: {
    type: Number,
    default: 0
  },
  renewalNotes: {
    type: String
  },
  reactivationNotes: {
    type: String
  },
  reactivatedAt: {
    type: Date
  },
  hasServiceContract: {
    type: Boolean,
    default: false
  },
  serviceStartDate: {
    type: Date
  },
  serviceEndDate: {
    type: Date
  },
  serviceValue: {
    type: Number
  },
  notes: {
    type: String,
    trim: true
  },
  lastContact: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// VKN validasyonu
customerSchema.pre('save', function(next) {
  // VKN 10 haneli olmalı ve sadece rakam içermeli
  if (this.vkn && !/^\d{10}$/.test(this.vkn)) {
    return next(new Error('VKN 10 haneli olmalı ve sadece rakam içermelidir'));
  }
  next();
});

// Güncelleme tarihini otomatik güncelle
customerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Customer', customerSchema);
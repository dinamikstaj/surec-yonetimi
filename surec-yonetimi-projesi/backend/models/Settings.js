const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Bildirim ayarları
  notifications: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    taskAssignmentNotifications: {
      type: Boolean,
      default: true
    },
    statusUpdateNotifications: {
      type: Boolean,
      default: true
    },
    overdueTaskNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    }
  },

  // Sistem ayarları
  system: {
    maxFileSize: {
      type: Number,
      default: 5,
      min: 1,
      max: 50
    },
    sessionTimeout: {
      type: Number,
      default: 60,
      min: 15,
      max: 480
    },
    maxUsersPerOrg: {
      type: Number,
      default: 100,
      min: 1,
      max: 1000
    },
    backupEnabled: {
      type: Boolean,
      default: true
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    allowRegistration: {
      type: Boolean,
      default: true
    }
  },

  // Email ayarları
  email: {
    smtpHost: {
      type: String,
      default: 'smtp.gmail.com'
    },
    smtpPort: {
      type: Number,
      default: 587
    },
    smtpUser: {
      type: String,
      default: ''
    },
    smtpPass: {
      type: String,
      default: ''
    },
    smtpSecure: {
      type: Boolean,
      default: true
    },
    fromName: {
      type: String,
      default: 'Süreç Yönetimi Sistemi'
    },
    fromEmail: {
      type: String,
      default: ''
    }
  },

  // SMS ayarları
  sms: {
    provider: {
      type: String,
      enum: ['netgsm', 'iletimerkezi', 'verimor'],
      default: 'netgsm'
    },
    apiKey: {
      type: String,
      default: ''
    },
    apiSecret: {
      type: String,
      default: ''
    },
    senderName: {
      type: String,
      default: 'DEMO'
    },
    enabled: {
      type: Boolean,
      default: false
    }
  },

  // Güvenlik ayarları
  security: {
    passwordMinLength: {
      type: Number,
      default: 6,
      min: 4,
      max: 20
    },
    passwordRequireUppercase: {
      type: Boolean,
      default: true
    },
    passwordRequireLowercase: {
      type: Boolean,
      default: true
    },
    passwordRequireNumbers: {
      type: Boolean,
      default: true
    },
    passwordRequireSpecialChars: {
      type: Boolean,
      default: false
    },
    passwordExpiryDays: {
      type: Number,
      default: 90,
      min: 30,
      max: 365
    },
    maxLoginAttempts: {
      type: Number,
      default: 5,
      min: 3,
      max: 10
    },
    lockoutDuration: {
      type: Number,
      default: 15,
      min: 5,
      max: 60
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false
    }
  },

  // Tema ve görünüm ayarları
  appearance: {
    defaultTheme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    companyName: {
      type: String,
      default: 'Süreç Yönetimi'
    },
    companyLogo: {
      type: String,
      default: ''
    },
    primaryColor: {
      type: String,
      default: '#007bff'
    },
    language: {
      type: String,
      enum: ['tr', 'en'],
      default: 'tr'
    }
  },

  // API ayarları
  api: {
    rateLimitEnabled: {
      type: Boolean,
      default: true
    },
    maxRequestsPerMinute: {
      type: Number,
      default: 100,
      min: 10,
      max: 1000
    },
    enableApiDocs: {
      type: Boolean,
      default: true
    }
  },

  // Log ayarları
  logging: {
    level: {
      type: String,
      enum: ['error', 'warn', 'info', 'debug'],
      default: 'info'
    },
    retentionDays: {
      type: Number,
      default: 30,
      min: 7,
      max: 365
    },
    enableAuditLog: {
      type: Boolean,
      default: true
    }
  },

  // Son güncelleme bilgileri
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Her organizasyon için tek settings kaydı olsun
settingsSchema.index({ organizationId: 1 }, { unique: true });

// Güncelleme tarihini otomatik güncelle
settingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Settings', settingsSchema); 
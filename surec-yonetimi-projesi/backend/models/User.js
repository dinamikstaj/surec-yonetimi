const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 💡 OverwriteModelError Çözümü: Modelin zaten derlenip derlenmediğini kontrol et.
if (mongoose.models.User) {
  module.exports = mongoose.models.User;
  return;
}

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // frontend name zorunlu gönderiyor
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: false, // opsiyonel olabilir
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['yonetici', 'kullanici'],
    default: 'kullanici',
  },
  avatar: {
    type: String,
    default: '',
  },
  statusMessage: {
    type: String,
    default: 'Selam!',
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Şifreyi kaydetmeden önce hashle
UserSchema.pre('save', async function (next) {
  console.log('Pre-save hook çalışıyor. isModified(password):', this.isModified('password'));
  
  if (!this.isModified('password')) {
    console.log('Password değişmemiş, hook atlanıyor');
    return next();
  }

  try {
    console.log('Password hash\'leniyor. Orijinal uzunluk:', this.password.length);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password hash\'lendi. Yeni uzunluk:', this.password.length);
    this.updatedAt = new Date();
    next();
  } catch (err) {
    console.error('Pre-save hook hatası:', err);
    next(err);
  }
});

module.exports = mongoose.model('User', UserSchema);

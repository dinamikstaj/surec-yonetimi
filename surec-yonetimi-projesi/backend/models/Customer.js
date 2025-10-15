const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  // Yeni MongoDB şeması - cari hesaplar migration'ından gelen alanlar
  cariKod: { type: String, trim: true },
  cariUnvan1: { type: String, trim: true },
  cariUnvan2: { type: String, trim: true },
  cariGuid: { type: String },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  website: { type: String, trim: true },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  district: { type: String, trim: true },
  vkn: { type: String, trim: true },
  taxOffice: { type: String, trim: true },
  eftAccountNumber: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  isLocked: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  eInvoiceEnabled: { type: Boolean, default: false },
  eInvoiceStartDate: { type: String, trim: true },
  smsNotification: { type: Boolean, default: false },
  emailNotification: { type: Boolean, default: false },
  reconciliationEmail: { type: String, trim: true },
  createDate: { type: String, trim: true },
  lastUpdateDate: { type: String, trim: true },
  createUser: { type: Number },
  lastUpdateUser: { type: Number },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// VKN validasyonu - yeni şemada VKN farklı formatlarda olabilir
customerSchema.pre('save', function(next) {
  // VKN validasyonu kaldırıldı çünkü migration verilerinde farklı formatlar var
  next();
});

// Güncelleme tarihini otomatik güncelle
customerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Customer', customerSchema);
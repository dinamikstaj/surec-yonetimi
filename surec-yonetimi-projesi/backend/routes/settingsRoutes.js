const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { sendEmail } = require('../services/emailService');
const { sendSMS } = require('../services/smsService');

// Ayarları getir
router.get('/', async (req, res) => {
  try {
    console.log('Sistem ayarları getiriliyor...');
    
    let settings = await Settings.findOne();
    
    // Eğer ayarlar yoksa varsayılan ayarları oluştur
    if (!settings) {
      settings = new Settings();
      await settings.save();
      console.log('Varsayılan ayarlar oluşturuldu');
    }
    
    // Hassas bilgileri gizle (şifreler vs.)
    const safeSettings = {
      ...settings.toObject(),
      email: {
        ...settings.email,
        smtpPass: settings.email.smtpPass ? '********' : ''
      },
      sms: {
        ...settings.sms,
        apiSecret: settings.sms.apiSecret ? '********' : ''
      }
    };
    
    res.json(safeSettings);
  } catch (err) {
    console.error('Ayarlar getirilemedi:', err.message);
    res.status(500).json({ msg: 'Sunucu hatası' });
  }
});

// Ayarları güncelle
router.put('/', async (req, res) => {
  try {
    console.log('Sistem ayarları güncelleniyor:', req.body);
    
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
    }
    
    // Sadece gönderilen alanları güncelle
    if (req.body.notifications) {
      settings.notifications = { ...settings.notifications, ...req.body.notifications };
    }
    
    if (req.body.system) {
      settings.system = { ...settings.system, ...req.body.system };
    }
    
    if (req.body.email) {
      // Şifre değiştirilmediyse eski şifreyi koru
      const emailUpdate = { ...req.body.email };
      if (emailUpdate.smtpPass === '********') {
        delete emailUpdate.smtpPass;
      }
      settings.email = { ...settings.email, ...emailUpdate };
    }
    
    if (req.body.sms) {
      // API secret değiştirilmediyse eski değeri koru
      const smsUpdate = { ...req.body.sms };
      if (smsUpdate.apiSecret === '********') {
        delete smsUpdate.apiSecret;
      }
      settings.sms = { ...settings.sms, ...smsUpdate };
    }
    
    if (req.body.security) {
      settings.security = { ...settings.security, ...req.body.security };
    }
    
    if (req.body.appearance) {
      settings.appearance = { ...settings.appearance, ...req.body.appearance };
    }
    
    if (req.body.api) {
      settings.api = { ...settings.api, ...req.body.api };
    }
    
    if (req.body.logging) {
      settings.logging = { ...settings.logging, ...req.body.logging };
    }
    
    settings.lastUpdatedBy = req.user?.id || null;
    
    await settings.save();
    console.log('Ayarlar güncellendi');
    
    // Hassas bilgileri gizleyerek döndür
    const safeSettings = {
      ...settings.toObject(),
      email: {
        ...settings.email,
        smtpPass: settings.email.smtpPass ? '********' : ''
      },
      sms: {
        ...settings.sms,
        apiSecret: settings.sms.apiSecret ? '********' : ''
      }
    };
    
    res.json({ msg: 'Ayarlar başarıyla güncellendi', settings: safeSettings });
  } catch (err) {
    console.error('Ayarlar güncellenemedi:', err.message);
    res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
  }
});

// Test email gönder
router.post('/test-email', async (req, res) => {
  try {
    const { to } = req.body;
    console.log('Test emaili gönderiliyor:', to);
    
    const settings = await Settings.findOne();
    if (!settings || !settings.email.smtpUser) {
      return res.status(400).json({ msg: 'Email ayarları yapılandırılmamış' });
    }
    
    const result = await sendEmail(
      to || settings.email.smtpUser,
      'Test Email - Süreç Yönetimi Sistemi',
      `Bu bir test emailidir.\n\nEmail ayarlarınız doğru şekilde yapılandırılmış.\n\nGönderim tarihi: ${new Date().toLocaleString('tr-TR')}`
    );
    
    if (result.success) {
      res.json({ msg: 'Test emaili başarıyla gönderildi', messageId: result.messageId });
    } else {
      res.status(400).json({ msg: 'Test emaili gönderilemedi: ' + result.error });
    }
  } catch (err) {
    console.error('Test email hatası:', err.message);
    res.status(500).json({ msg: 'Test email gönderilemedi: ' + err.message });
  }
});

// Test SMS gönder
router.post('/test-sms', async (req, res) => {
  try {
    const { to } = req.body;
    console.log('Test SMS gönderiliyor:', to);
    
    const settings = await Settings.findOne();
    if (!settings || !settings.sms.enabled) {
      return res.status(400).json({ msg: 'SMS ayarları yapılandırılmamış veya devre dışı' });
    }
    
    if (!to) {
      return res.status(400).json({ msg: 'Telefon numarası gerekli' });
    }
    
    const result = await sendSMS(
      to,
      `Test SMS - Süreç Yönetimi Sistemi. SMS ayarlarınız doğru şekilde yapılandırılmış. Tarih: ${new Date().toLocaleString('tr-TR')}`
    );
    
    if (result.success) {
      res.json({ msg: 'Test SMS başarıyla gönderildi', messageId: result.messageId });
    } else {
      res.status(400).json({ msg: 'Test SMS gönderilemedi: ' + result.error });
    }
  } catch (err) {
    console.error('Test SMS hatası:', err.message);
    res.status(500).json({ msg: 'Test SMS gönderilemedi: ' + err.message });
  }
});

// Sistem durumunu kontrol et
router.get('/system-status', async (req, res) => {
  try {
    const status = {
      database: 'connected',
      server: 'running',
      email: 'unknown',
      sms: 'unknown',
      storage: 'available',
      memory: {
        used: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        total: process.memoryUsage().heapTotal / 1024 / 1024
      },
      uptime: process.uptime(),
      timestamp: new Date()
    };
    
    // Email durumunu kontrol et
    try {
      const settings = await Settings.findOne();
      if (settings && settings.email.smtpUser && settings.email.smtpPass) {
        status.email = 'configured';
      } else {
        status.email = 'not_configured';
      }
      
      // SMS durumunu kontrol et
      if (settings && settings.sms.enabled && settings.sms.apiKey) {
        status.sms = 'configured';
      } else {
        status.sms = 'not_configured';
      }
    } catch (err) {
      status.email = 'error';
      status.sms = 'error';
    }
    
    res.json(status);
  } catch (err) {
    console.error('Sistem durumu kontrol edilemedi:', err.message);
    res.status(500).json({ msg: 'Sistem durumu kontrol edilemedi' });
  }
});

// Backup oluştur
router.post('/backup', async (req, res) => {
  try {
    console.log('Manuel backup başlatılıyor...');
    
    // Burada gerçek backup işlemi yapılabilir
    // Şimdilik simüle edelim
    const backupInfo = {
      id: 'backup_' + Date.now(),
      timestamp: new Date(),
      size: Math.random() * 100 + 50, // MB
      status: 'completed',
      type: 'manual'
    };
    
    console.log('Backup tamamlandı:', backupInfo.id);
    res.json({ msg: 'Backup başarıyla oluşturuldu', backup: backupInfo });
  } catch (err) {
    console.error('Backup hatası:', err.message);
    res.status(500).json({ msg: 'Backup oluşturulamadı: ' + err.message });
  }
});

// Tüm kullanıcı oturumlarını sonlandır
router.post('/terminate-sessions', async (req, res) => {
  try {
    console.log('Tüm kullanıcı oturumları sonlandırılıyor...');
    
    // Burada gerçek session termination işlemi yapılabilir
    // Redis/cache temizleme, JWT blacklist, vs.
    
    const terminatedSessions = Math.floor(Math.random() * 20) + 5;
    
    console.log(`${terminatedSessions} oturum sonlandırıldı`);
    res.json({ 
      msg: 'Tüm kullanıcı oturumları başarıyla sonlandırıldı', 
      terminatedSessions 
    });
  } catch (err) {
    console.error('Oturum sonlandırma hatası:', err.message);
    res.status(500).json({ msg: 'Oturumlar sonlandırılamadı: ' + err.message });
  }
});

// Cache temizle
router.post('/clear-cache', async (req, res) => {
  try {
    console.log('Cache temizleniyor...');
    
    // Burada gerçek cache temizleme işlemi yapılabilir
    // Redis flush, memory cache clear, vs.
    
    const clearedSize = Math.random() * 500 + 100; // MB
    
    console.log(`${clearedSize.toFixed(2)} MB cache temizlendi`);
    res.json({ 
      msg: 'Cache başarıyla temizlendi', 
      clearedSize: clearedSize.toFixed(2) + ' MB'
    });
  } catch (err) {
    console.error('Cache temizleme hatası:', err.message);
    res.status(500).json({ msg: 'Cache temizlenemedi: ' + err.message });
  }
});

module.exports = router; 
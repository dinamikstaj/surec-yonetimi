const express = require('express');
const router = express.Router();
const Communication = require('../models/Communication');
const Customer = require('../models/Customer');
const { sendEmail } = require('../services/emailService');
const { sendSMS } = require('../services/smsService');

// İletişim geçmişini getir
router.get('/', async (req, res) => {
  try {
    const communications = await Communication.find()
      .populate('customerId', 'name email phone')
      .sort({ sentAt: -1 });
    
    res.json(communications);
  } catch (err) {
    console.error('İletişim geçmişi getirilemedi:', err.message);
    res.status(500).json({ msg: 'Sunucu hatası' });
  }
});

// İletişim gönder
router.post('/', async (req, res) => {
  try {
    console.log('İletişim gönderiliyor:', req.body);
    
    const { 
      customerId, 
      type, 
      subject, 
      content, 
      sendEmail, 
      sendSms, 
      customerEmail, 
      customerPhone 
    } = req.body;

    if (!customerId || !content) {
      return res.status(400).json({ msg: 'Müşteri ID ve mesaj içeriği zorunludur' });
    }

    if (!sendEmail && !sendSms) {
      return res.status(400).json({ msg: 'En az bir iletişim yöntemi seçmelisiniz' });
    }

    // Müşteriyi bul
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ msg: 'Müşteri bulunamadı' });
    }

    // İletişim kaydı oluştur
    const communication = new Communication({
      customerId,
      type,
      subject: subject || null,
      content,
      sentBy: 'admin', // Gerçek uygulamada req.user.id kullanılabilir
      emailTo: sendEmail ? customerEmail : null,
      emailSubject: sendEmail ? subject : null,
      smsTo: sendSms ? customerPhone : null,
      status: 'pending'
    });

    await communication.save();

    let emailResult = null;
    let smsResult = null;

    // E-posta gönderimi
    if (sendEmail && customerEmail) {
      try {
        emailResult = await sendEmail(customerEmail, subject || 'Bilgilendirme', content);
        if (emailResult.success) {
          console.log(`✅ Email başarıyla gönderildi: ${customerEmail}`);
          communication.status = 'sent';
        } else {
          console.error(`❌ Email gönderme hatası: ${emailResult.error}`);
          communication.status = 'failed';
          communication.errorMessage = emailResult.error;
        }
        await communication.save();
      } catch (error) {
        console.error('Email gönderme hatası:', error);
        communication.status = 'failed';
        communication.errorMessage = error.message;
        await communication.save();
      }
    }

    // SMS gönderimi
    if (sendSms && customerPhone) {
      try {
        smsResult = await sendSMS(customerPhone, content);
        if (smsResult.success) {
          console.log(`✅ SMS başarıyla gönderildi: ${customerPhone}`);
          if (communication.status !== 'failed') {
            communication.status = 'sent';
          }
        } else {
          console.error(`❌ SMS gönderme hatası: ${smsResult.error}`);
          communication.status = 'failed';
          communication.errorMessage = (communication.errorMessage || '') + '; SMS: ' + smsResult.error;
        }
        await communication.save();
      } catch (error) {
        console.error('SMS gönderme hatası:', error);
        communication.status = 'failed';
        communication.errorMessage = (communication.errorMessage || '') + '; SMS: ' + error.message;
        await communication.save();
      }
    }

    // Müşterinin son iletişim tarihini güncelle
    customer.lastContact = new Date();
    await customer.save();

    console.log('İletişim kaydedildi:', communication._id);
    res.status(201).json({ 
      msg: 'İletişim başarıyla gönderildi', 
      communication 
    });

  } catch (err) {
    console.error('İletişim gönderme hatası:', err.message);
    res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
  }
});

// Belirli müşterinin iletişim geçmişini getir
router.get('/customer/:customerId', async (req, res) => {
  try {
    const communications = await Communication.find({ customerId: req.params.customerId })
      .sort({ sentAt: -1 });
    
    res.json(communications);
  } catch (err) {
    console.error('Müşteri iletişim geçmişi getirilemedi:', err.message);
    res.status(500).json({ msg: 'Sunucu hatası' });
  }
});

module.exports = router; 
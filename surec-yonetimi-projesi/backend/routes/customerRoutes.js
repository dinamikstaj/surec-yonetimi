const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// Tüm müşterileri getir
router.get('/', async (req, res) => {
  try {
    console.log('Tüm müşteriler getiriliyor...');
    const customers = await Customer.find().sort({ createdAt: -1 });
    console.log(`${customers.length} müşteri bulundu`);
    res.json(customers);
  } catch (err) {
    console.error('Müşteriler getirilemedi:', err.message);
    res.status(500).json({ msg: 'Sunucu hatası' });
  }
});

// Belirli müşteriyi getir
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ msg: 'Müşteri bulunamadı' });
    }
    res.json(customer);
  } catch (err) {
    console.error('Müşteri getirilemedi:', err.message);
    res.status(500).json({ msg: 'Sunucu hatası' });
  }
});

// Yeni müşteri oluştur
router.post('/', async (req, res) => {
  try {
    console.log('Yeni müşteri oluşturuluyor:', req.body);
    
    const {
      cariKod,
      cariUnvan1,
      cariUnvan2,
      cariGuid,
      email,
      phone,
      website,
      address,
      city,
      district,
      vkn,
      taxOffice,
      eftAccountNumber,
      isActive,
      isLocked,
      isDeleted,
      eInvoiceEnabled,
      eInvoiceStartDate,
      smsNotification,
      emailNotification,
      reconciliationEmail,
      createDate,
      lastUpdateDate,
      createUser,
      lastUpdateUser
    } = req.body;

    // E-posta kontrolü (varsa)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ msg: 'Geçerli bir e-posta adresi giriniz' });
    }

    // VKN benzersizlik kontrolü (varsa)
    if (vkn) {
      const existingCustomer = await Customer.findOne({ vkn });
      if (existingCustomer) {
        return res.status(400).json({ msg: 'Bu VKN ile kayıtlı müşteri zaten mevcut' });
      }
    }

    // E-posta benzersizlik kontrolü (varsa)
    if (email) {
      const existingEmail = await Customer.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ msg: 'Bu e-posta adresi ile kayıtlı müşteri zaten mevcut' });
      }
    }

    const customer = new Customer({
      cariKod,
      cariUnvan1,
      cariUnvan2,
      cariGuid,
      email,
      phone,
      website,
      address,
      city,
      district,
      vkn,
      taxOffice,
      eftAccountNumber,
      isActive: isActive !== undefined ? isActive : true,
      isLocked: isLocked !== undefined ? isLocked : false,
      isDeleted: isDeleted !== undefined ? isDeleted : false,
      eInvoiceEnabled: eInvoiceEnabled !== undefined ? eInvoiceEnabled : false,
      eInvoiceStartDate,
      smsNotification: smsNotification !== undefined ? smsNotification : false,
      emailNotification: emailNotification !== undefined ? emailNotification : false,
      reconciliationEmail,
      createDate,
      lastUpdateDate,
      createUser,
      lastUpdateUser
    });

    await customer.save();
    console.log('Müşteri oluşturuldu:', customer._id);
    res.status(201).json({ msg: 'Müşteri başarıyla oluşturuldu', customer });
  } catch (err) {
    console.error('Müşteri oluşturma hatası:', err.message);
    res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
  }
});

// Müşteriyi güncelle
router.put('/:id', async (req, res) => {
  try {
    console.log('Müşteri güncelleniyor:', req.params.id);
    
    const {
      cariKod,
      cariUnvan1,
      cariUnvan2,
      cariGuid,
      email,
      phone,
      website,
      address,
      city,
      district,
      vkn,
      taxOffice,
      eftAccountNumber,
      isActive,
      isLocked,
      isDeleted,
      eInvoiceEnabled,
      eInvoiceStartDate,
      smsNotification,
      emailNotification,
      reconciliationEmail,
      createDate,
      lastUpdateDate,
      createUser,
      lastUpdateUser
    } = req.body;

    // E-posta kontrolü (varsa)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ msg: 'Geçerli bir e-posta adresi giriniz' });
    }

    // VKN benzersizlik kontrolü (varsa ve kendi ID'si hariç)
    if (vkn) {
      const existingCustomer = await Customer.findOne({ vkn, _id: { $ne: req.params.id } });
      if (existingCustomer) {
        return res.status(400).json({ msg: 'Bu VKN ile kayıtlı başka bir müşteri mevcut' });
      }
    }

    // E-posta benzersizlik kontrolü (varsa ve kendi ID'si hariç)
    if (email) {
      const existingEmail = await Customer.findOne({ email, _id: { $ne: req.params.id } });
      if (existingEmail) {
        return res.status(400).json({ msg: 'Bu e-posta adresi ile kayıtlı başka bir müşteri mevcut' });
      }
    }

    // Sadece gönderilen alanları güncelle
    const updateData = { updatedAt: new Date() };
    if (cariKod !== undefined) updateData.cariKod = cariKod;
    if (cariUnvan1 !== undefined) updateData.cariUnvan1 = cariUnvan1;
    if (cariUnvan2 !== undefined) updateData.cariUnvan2 = cariUnvan2;
    if (cariGuid !== undefined) updateData.cariGuid = cariGuid;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (website !== undefined) updateData.website = website;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (district !== undefined) updateData.district = district;
    if (vkn !== undefined) updateData.vkn = vkn;
    if (taxOffice !== undefined) updateData.taxOffice = taxOffice;
    if (eftAccountNumber !== undefined) updateData.eftAccountNumber = eftAccountNumber;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isLocked !== undefined) updateData.isLocked = isLocked;
    if (isDeleted !== undefined) updateData.isDeleted = isDeleted;
    if (eInvoiceEnabled !== undefined) updateData.eInvoiceEnabled = eInvoiceEnabled;
    if (eInvoiceStartDate !== undefined) updateData.eInvoiceStartDate = eInvoiceStartDate;
    if (smsNotification !== undefined) updateData.smsNotification = smsNotification;
    if (emailNotification !== undefined) updateData.emailNotification = emailNotification;
    if (reconciliationEmail !== undefined) updateData.reconciliationEmail = reconciliationEmail;
    if (createDate !== undefined) updateData.createDate = createDate;
    if (lastUpdateDate !== undefined) updateData.lastUpdateDate = lastUpdateDate;
    if (createUser !== undefined) updateData.createUser = createUser;
    if (lastUpdateUser !== undefined) updateData.lastUpdateUser = lastUpdateUser;

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ msg: 'Müşteri bulunamadı' });
    }

    console.log('Müşteri güncellendi:', customer._id);
    res.json({ msg: 'Müşteri başarıyla güncellendi', customer });
  } catch (err) {
    console.error('Müşteri güncelleme hatası:', err.message);
    res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
  }
});

// Müşteriyi sil
router.delete('/:id', async (req, res) => {
  try {
    console.log('Müşteri siliniyor:', req.params.id);
    
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ msg: 'Müşteri bulunamadı' });
    }

    console.log('Müşteri silindi:', customer._id);
    res.json({ msg: 'Müşteri başarıyla silindi' });
  } catch (err) {
    console.error('Müşteri silme hatası:', err.message);
    res.status(500).json({ msg: 'Sunucu hatası' });
  }
});

// Müşteri arama
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const customers = await Customer.find({
      $or: [
        { cariUnvan1: { $regex: query, $options: 'i' } },
        { cariUnvan2: { $regex: query, $options: 'i' } },
        { cariKod: { $regex: query, $options: 'i' } },
        { vkn: { $regex: query, $options: 'i' } },
        { city: { $regex: query, $options: 'i' } },
        { district: { $regex: query, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });

    res.json(customers);
  } catch (err) {
    console.error('Müşteri arama hatası:', err.message);
    res.status(500).json({ msg: 'Sunucu hatası' });
  }
});

module.exports = router;
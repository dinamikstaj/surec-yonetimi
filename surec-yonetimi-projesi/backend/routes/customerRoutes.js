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
      name,
      company,
      vkn,
      email,
      phone,
      address,
      city,
      district,
      postalCode,
      country,
      status,
      notes,
      branches,
      authorizedPerson,
      hasMaintenanceContract,
      hasServiceContract
    } = req.body;

    // VKN kontrolü
    if (!vkn || !/^\d{10}$/.test(vkn)) {
      return res.status(400).json({ msg: 'VKN 10 haneli olmalı ve sadece rakam içermelidir' });
    }

    // E-posta kontrolü
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ msg: 'Geçerli bir e-posta adresi giriniz' });
    }

    // VKN benzersizlik kontrolü
    const existingCustomer = await Customer.findOne({ vkn });
    if (existingCustomer) {
      return res.status(400).json({ msg: 'Bu VKN ile kayıtlı müşteri zaten mevcut' });
    }

    // E-posta benzersizlik kontrolü
    const existingEmail = await Customer.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ msg: 'Bu e-posta adresi ile kayıtlı müşteri zaten mevcut' });
    }

    // Şube validasyonu (opsiyonel)
    if (branches && branches.length > 0) {
      // Ana şube kontrolü (eğer şube varsa)
      const mainBranches = branches.filter(branch => branch.isMain);
      if (mainBranches.length > 1) {
        return res.status(400).json({ msg: 'Birden fazla ana şube belirtilemez' });
      }

      // Şube e-posta benzersizlik kontrolü
      const branchEmails = branches.map(branch => branch.email).filter(email => email);
      const uniqueBranchEmails = [...new Set(branchEmails)];
      if (branchEmails.length !== uniqueBranchEmails.length) {
        return res.status(400).json({ msg: 'Şube e-posta adresleri benzersiz olmalıdır' });
      }
    }

    const customer = new Customer({
      name,
      company,
      vkn,
      email,
      phone,
      address,
      city,
      district,
      postalCode,
      country,
      status,
      notes,
      branches,
      authorizedPerson,
      hasMaintenanceContract: hasMaintenanceContract || false,
      hasServiceContract: hasServiceContract || false
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
      name,
      company,
      vkn,
      email,
      phone,
      address,
      city,
      district,
      postalCode,
      country,
      status,
      notes,
      branches,
      authorizedPerson,
      hasMaintenanceContract,
      hasServiceContract
    } = req.body;

    // VKN kontrolü (varsa)
    if (vkn && !/^\d{10}$/.test(vkn)) {
      return res.status(400).json({ msg: 'VKN 10 haneli olmalı ve sadece rakam içermelidir' });
    }

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

    // Şube validasyonu (opsiyonel)
    if (branches && branches.length > 0) {
      // Ana şube kontrolü (eğer şube varsa)
      const mainBranches = branches.filter(branch => branch.isMain);
      if (mainBranches.length > 1) {
        return res.status(400).json({ msg: 'Birden fazla ana şube belirtilemez' });
      }
    }

    // Sadece gönderilen alanları güncelle
    const updateData = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (company !== undefined) updateData.company = company;
    if (vkn !== undefined) updateData.vkn = vkn;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (district !== undefined) updateData.district = district;
    if (postalCode !== undefined) updateData.postalCode = postalCode;
    if (country !== undefined) updateData.country = country;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (branches !== undefined) updateData.branches = branches;
    if (authorizedPerson !== undefined) updateData.authorizedPerson = authorizedPerson;
    if (hasMaintenanceContract !== undefined) updateData.hasMaintenanceContract = hasMaintenanceContract;
    if (hasServiceContract !== undefined) updateData.hasServiceContract = hasServiceContract;

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
        { name: { $regex: query, $options: 'i' } },
        { company: { $regex: query, $options: 'i' } },
        { vkn: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });

    res.json(customers);
  } catch (err) {
    console.error('Müşteri arama hatası:', err.message);
    res.status(500).json({ msg: 'Sunucu hatası' });
  }
});

module.exports = router;
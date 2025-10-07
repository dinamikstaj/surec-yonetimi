const express = require('express');
const router = express.Router();
const Process = require('../models/Process');
const User = require('../models/User');

// Tüm süreçleri getir
router.get('/', async (req, res) => {
  try {
    console.log('Tüm süreçler getiriliyor...');
    const processes = await Process.find()
      .populate('createdBy', 'name email')
      .populate('assignedTeam', 'name email avatar')
      .sort({ createdAt: -1 });

    console.log('Süreçler getirildi:', processes.length);
    res.json(processes);
  } catch (err) {
    console.error('Süreçler getirilemedi:', err.message);
    res.status(500).json({ msg: 'Sunucu hatası' });
  }
});

// Yeni süreç oluştur
router.post('/', async (req, res) => {
  try {
    console.log('Yeni süreç oluşturuluyor:', req.body);
    
    const { 
      title, 
      description, 
      priority, 
      assignedTeam, 
      startDate, 
      endDate, 
      tags, 
      budget, 
      estimatedDuration,
      createdBy 
    } = req.body;

    if (!title || !description || !createdBy) {
      return res.status(400).json({ msg: 'Başlık, açıklama ve oluşturan kişi zorunludur' });
    }

    // CreatedBy kullanıcısını kontrol et
    const creator = await User.findById(createdBy);
    if (!creator) {
      return res.status(404).json({ msg: 'Oluşturan kullanıcı bulunamadı' });
    }

    const newProcess = new Process({
      title,
      description,
      priority: priority || 'medium',
      assignedTeam: assignedTeam || [],
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      tags: tags || [],
      budget: budget ? parseFloat(budget) : null,
      estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : null,
      createdBy,
    });

    await newProcess.save();

    // Populated process'i geri döndür
    const populatedProcess = await Process.findById(newProcess._id)
      .populate('createdBy', 'name email')
      .populate('assignedTeam', 'name email avatar');

    console.log('Süreç oluşturuldu:', populatedProcess._id);

    // Aktivite kaydı oluştur
    await createActivity(
      createdBy,
      `Yeni süreç oluşturuldu: "${title}"`,
      creator.email
    );

    res.status(201).json({ 
      msg: 'Süreç başarıyla oluşturuldu', 
      process: populatedProcess 
    });

  } catch (err) {
    console.error('Süreç oluşturma hatası:', err.message);
    res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
  }
});

// Süreç durumunu güncelle
router.put('/:id/status', async (req, res) => {
  try {
    const { status, userId } = req.body;
    
    if (!status) {
      return res.status(400).json({ msg: 'Durum bilgisi gerekli' });
    }

    const process = await Process.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTeam', 'name email avatar');

    if (!process) {
      return res.status(404).json({ msg: 'Süreç bulunamadı' });
    }

    const oldStatus = process.status;
    process.status = status;

    if (status === 'completed') {
      process.progress = 100;
      process.actualDuration = process.startDate 
        ? Math.ceil((new Date() - new Date(process.startDate)) / (1000 * 60 * 60 * 24))
        : null;
    }

    await process.save();

    // Aktivite kaydı
    await createActivity(
      process.createdBy._id,
      `"${process.title}" süreci "${status}" durumuna güncellendi`,
      process.createdBy.email,
      userId
    );

    console.log('Süreç durumu güncellendi:', process._id, oldStatus, '->', status);
    res.json({ msg: 'Süreç durumu güncellendi', process });

  } catch (err) {
    console.error('Süreç durumu güncellenemedi:', err.message);
    res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
  }
});

// Süreç ilerlemesini güncelle
router.put('/:id/progress', async (req, res) => {
  try {
    const { progress, userId } = req.body;
    
    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({ msg: 'İlerleme 0-100 arasında olmalıdır' });
    }

    const process = await Process.findById(req.params.id);
    if (!process) {
      return res.status(404).json({ msg: 'Süreç bulunamadı' });
    }

    process.progress = progress;
    
    // %100 olursa completed yap
    if (progress === 100 && process.status !== 'completed') {
      process.status = 'completed';
      process.actualDuration = process.startDate 
        ? Math.ceil((new Date() - new Date(process.startDate)) / (1000 * 60 * 60 * 24))
        : null;
    }

    await process.save();

    // Aktivite kaydı
    await createActivity(
      process.createdBy,
      `"${process.title}" süreci %${progress} tamamlandı`,
      'System',
      userId
    );

    console.log('Süreç ilerlemesi güncellendi:', process._id, progress + '%');
    res.json({ msg: 'Süreç ilerlemesi güncellendi', process });

  } catch (err) {
    console.error('Süreç ilerlemesi güncellenemedi:', err.message);
    res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
  }
});

// Süreç sil
router.delete('/:id', async (req, res) => {
  try {
    const process = await Process.findById(req.params.id);
    
    if (!process) {
      return res.status(404).json({ msg: 'Süreç bulunamadı' });
    }

    await Process.findByIdAndDelete(req.params.id);
    
    console.log('Süreç silindi:', req.params.id);
    res.json({ msg: 'Süreç silindi' });

  } catch (err) {
    console.error('Süreç silinemedi:', err.message);
    res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
  }
});

// Etkinlik oluşturma helper fonksiyonu
async function createActivity(userId, message, username, actorId = null) {
  try {
    const mongoose = require('mongoose');
    const Activity = mongoose.models.Activity || mongoose.model('Activity', new mongoose.Schema({
      message: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      username: String,
      userId: String,
      actorId: String,
    }));

    const newActivity = new Activity({
      message,
      username,
      userId: userId.toString(),
      actorId: actorId ? actorId.toString() : null
    });

    await newActivity.save();
    return newActivity;
  } catch (error) {
    console.error('Etkinlik oluşturma hatası:', error);
  }
}

module.exports = router; 
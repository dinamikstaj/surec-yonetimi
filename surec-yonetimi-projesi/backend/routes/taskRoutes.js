const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');

// Tüm görevleri getir (admin için)
router.get('/', async (req, res) => {
  try {
    console.log('Tüm görevler getiriliyor...');
    const tasks = await Task.find()
      .populate('assignedTo', 'name email avatar')
      .populate('assignedBy', 'name email avatar')
      .sort({ createdAt: -1 });

    console.log('Görevler getirildi:', tasks.length);
    res.json(tasks);
  } catch (err) {
    console.error('Görevler getirilemedi:', err.message);
    res.status(500).json({ msg: 'Sunucu hatası' });
  }
});

// Kullanıcıya atanan görevleri getir
router.get('/user/:userId', async (req, res) => {
  try {
    console.log('Kullanıcı görevleri getiriliyor:', req.params.userId);
    const tasks = await Task.find({ assignedTo: req.params.userId })
      .populate('assignedBy', 'name email avatar')
      .sort({ createdAt: -1 });

    console.log('Kullanıcı görevleri getirildi:', tasks.length);
    res.json(tasks);
  } catch (err) {
    console.error('Kullanıcı görevleri getirilemedi:', err.message);
    res.status(500).json({ msg: 'Sunucu hatası' });
  }
});

// Yeni görev oluştur
router.post('/', async (req, res) => {
  const io = req.app.get('io');
  
  try {
    console.log('Görev oluşturma isteği alındı:', req.body);
    
    const { title, description, assignedTo, assignedBy, priority, dueDate, notes } = req.body;

    if (!title || !description || !assignedTo || !assignedBy) {
      console.log('Eksik alanlar:', { title, description, assignedTo, assignedBy });
      return res.status(400).json({ msg: 'Başlık, açıklama, atanan kişi ve atan kişi zorunludur' });
    }

    console.log('Atanan kullanıcı aranıyor:', assignedTo);
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      console.log('Atanan kullanıcı bulunamadı:', assignedTo);
      return res.status(404).json({ msg: 'Atanan kullanıcı bulunamadı' });
    }
    console.log('Atanan kullanıcı bulundu:', assignedUser.email);

    console.log('Atan kullanıcı aranıyor:', assignedBy);
    const assigningUser = await User.findById(assignedBy);
    if (!assigningUser) {
      console.log('Atan kullanıcı bulunamadı:', assignedBy);
      return res.status(404).json({ msg: 'Görevi atan kullanıcı bulunamadı' });
    }
    console.log('Atan kullanıcı bulundu:', assigningUser.email);

    console.log('Task oluşturuluyor...');
    const newTask = new Task({
      title,
      description,
      assignedTo,
      assignedBy,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes || '',
    });

    await newTask.save();
    console.log('Task kaydedildi:', newTask._id);

    const populatedTask = await Task.findById(newTask._id)
      .populate('assignedTo', 'name email avatar')
      .populate('assignedBy', 'name email avatar');
    
    console.log('Populated task:', populatedTask);

    if (io) {
      io.emit('new_task_assigned', {
        taskId: populatedTask._id,
        assignedTo: assignedTo,
        assignedBy: assigningUser.name || assigningUser.email,
        title: title,
        message: `${assigningUser.name || assigningUser.email} size yeni bir görev atadı: "${title}"`,
        createdAt: new Date().toISOString()
      });
      console.log('Socket bildirim gönderildi');
    }

    await createActivity(
      assignedTo, 
      `Yeni görev atandı: "${title}"`, 
      assignedUser.email,
      assignedBy
    );
    console.log('Aktivite kaydı oluşturuldu');

    res.status(201).json({ 
      msg: 'Görev başarıyla oluşturuldu', 
      task: populatedTask 
    });

  } catch (err) {
    console.error('Görev oluşturma hatası:', err);
    res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
  }
});

// Görev durumunu güncelle
router.put('/:id/status', async (req, res) => {
  const io = req.app.get('io');
  
  try {
    console.log('Task status update isteği:', {
      taskId: req.params.id,
      body: req.body
    });
    
    const { status, userId } = req.body;
    
    if (!status) {
      console.log('Status bilgisi eksik');
      return res.status(400).json({ msg: 'Durum bilgisi gerekli' });
    }

    console.log('Task aranıyor:', req.params.id);
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('assignedBy', 'name email avatar');

    if (!task) {
      console.log('Task bulunamadı:', req.params.id);
      return res.status(404).json({ msg: 'Görev bulunamadı' });
    }

    console.log('Task bulundu:', {
      id: task._id,
      title: task.title,
      currentStatus: task.status,
      newStatus: status,
      assignedTo: task.assignedTo._id,
      requestUserId: userId
    });

    const oldStatus = task.status;
    task.status = status;
    
    if (status === 'pending-approval' && userId === task.assignedTo._id.toString()) {
      console.log('Personel görevi onaya gönderdi');
      
      if (io) {
        io.emit('task_needs_approval', {
          taskId: task._id,
          assignedBy: task.assignedBy._id,
          assignedTo: task.assignedTo.name || task.assignedTo.email,
          title: task.title,
          message: `"${task.title}" görevi ${task.assignedTo.name || task.assignedTo.email} tarafından tamamlandı ve onayınızı bekliyor`,
          createdAt: new Date().toISOString()
        });
        console.log('Yöneticiye onay bildirimi gönderildi');
      }

      await createActivity(
        task.assignedBy._id,
        `"${task.title}" görevi tamamlandı ve onay bekliyor`,
        task.assignedBy.email,
        userId
      );
      console.log('Onay bekliyor aktivite kaydı oluşturuldu');
      
    } else if (status === 'completed') {
      task.completedAt = new Date();
      console.log('Görev tamamlandı olarak işaretlendi');
    }

    console.log('Task kaydediliyor...');
    await task.save();
    console.log('Task başarıyla kaydedildi');

    let responseMessage = 'Görev durumu güncellendi';
    
    if (status === 'pending-approval' && userId === task.assignedTo._id.toString()) {
      responseMessage = 'Görev tamamlandı ve yönetici onayı için gönderildi';
    }

    if (oldStatus !== task.status && task.status !== 'pending-approval') {
      const statusText = {
        'pending': 'Beklemede',
        'in-progress': 'Devam Ediyor',
        'pending-approval': 'Onay Bekliyor',
        'completed': 'Tamamlandı',
        'cancelled': 'İptal Edildi',
        'rejected': 'Reddedildi'
      };

      if (io) {
        io.emit('task_status_updated', {
          taskId: task._id,
          assignedBy: task.assignedBy._id,
          assignedTo: task.assignedTo.name || task.assignedTo.email,
          title: task.title,
          oldStatus: statusText[oldStatus],
          newStatus: statusText[task.status],
          message: `"${task.title}" görevi durumu "${statusText[task.status]}" olarak güncellendi`,
          createdAt: new Date().toISOString()
        });
        console.log('Status güncelleme bildirimi gönderildi');
      }

      await createActivity(
        task.assignedTo._id,
        `"${task.title}" görevi "${statusText[task.status]}" olarak işaretlendi`,
        task.assignedTo.email,
        userId
      );
      console.log('Status güncelleme aktivite kaydı oluşturuldu');
    }

    console.log('Response gönderiliyor:', responseMessage);
    res.json({ msg: responseMessage, task });

  } catch (err) {
    console.error('Görev durumu güncelleme hatası:', err);
    res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
  }
});

// Yönetici görev onayı/reddi
router.put('/:id/approve', async (req, res) => {
  const io = req.app.get('io');
  
  try {
    const { approved, rejectionReason, userId } = req.body;
    
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('assignedBy', 'name email avatar');

    if (!task) {
      return res.status(404).json({ msg: 'Görev bulunamadı' });
    }

    if (task.status !== 'pending-approval') {
      return res.status(400).json({ msg: 'Bu görev onay bekleyen durumda değil' });
    }

    if (approved) {
      task.status = 'completed';
      task.completedAt = new Date();
      
      if (io) {
        io.emit('task_approved', {
          taskId: task._id,
          assignedTo: task.assignedTo._id,
          assignedBy: task.assignedBy.name || task.assignedBy.email,
          title: task.title,
          message: `"${task.title}" göreviniz yönetici tarafından onaylandı`,
          createdAt: new Date().toISOString()
        });
      }

      await createActivity(
        task.assignedTo._id,
        `"${task.title}" görevi yönetici tarafından onaylandı`,
        task.assignedTo.email,
        userId
      );
      
    } else {
      task.status = 'rejected';
      task.notes = rejectionReason || task.notes;
      
      if (io) {
        io.emit('task_rejected', {
          taskId: task._id,
          assignedTo: task.assignedTo._id,
          assignedBy: task.assignedBy.name || task.assignedBy.email,
          title: task.title,
          rejectionReason: rejectionReason || 'Belirtilmemiş',
          message: `"${task.title}" göreviniz reddedildi: ${rejectionReason || 'Sebep belirtilmemiş'}`,
          createdAt: new Date().toISOString()
        });
      }

      await createActivity(
        task.assignedTo._id,
        `"${task.title}" görevi reddedildi - ${rejectionReason || 'Sebep belirtilmemiş'}`,
        task.assignedTo.email,
        userId
      );
    }

    await task.save();

    res.json({ 
      msg: approved ? 'Görev onaylandı' : 'Görev reddedildi', 
      task 
    });

  } catch (err) {
    console.error('Görev onay/red hatası:', err.message);
    res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
  }
});

// Onay bekleyen görevleri getir
router.get('/pending-approval', async (req, res) => {
  try {
    const tasks = await Task.find({ status: 'pending-approval' })
      .populate('assignedTo', 'name email avatar')
      .populate('assignedBy', 'name email avatar')
      .sort({ updatedAt: -1 });

    console.log('Onay bekleyen görevler:', tasks.length);
    res.json(tasks);
  } catch (err) {
    console.error('Onay bekleyen görevler getirilemedi:', err.message);
    res.status(500).json({ msg: 'Sunucu hatası' });
  }
});

// Görev sil
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ msg: 'Görev bulunamadı' });
    }

    await Task.findByIdAndDelete(req.params.id);
    
    res.json({ msg: 'Görev silindi' });

  } catch (err) {
    console.error('Görev silinemedi:', err.message);
    res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
  }
});

// Etkinlik oluşturma helper fonksiyonu
async function createActivity(userId, message, username, actorId = null, taskId = null, activityType = 'task_created') {
  try {
    const Activity = require('../models/Activity');

    const newActivity = new Activity({
      action: activityType === 'task_created' ? 'Görev Oluşturuldu' : 
              activityType === 'task_completed' ? 'Görev Tamamlandı' :
              activityType === 'task_approved' ? 'Görev Onaylandı' :
              activityType === 'task_rejected' ? 'Görev Reddedildi' : 'Aktivite',
      message,
      user: actorId || userId,
      relatedUser: userId,
      relatedTask: taskId,
      activityType: activityType,
      read: false
    });

    await newActivity.save();
    console.log('Activity kaydedildi:', newActivity._id);
    return newActivity;
  } catch (error) {
    console.error('Etkinlik oluşturma hatası:', error);
  }
}

module.exports = router;
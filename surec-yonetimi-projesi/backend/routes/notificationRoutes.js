const express = require('express');
const router = express.Router();

// Kullanıcıya ait bildirimleri getir
router.get('/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const Activity = require('../models/Activity');
        const Task = require('../models/Task');
        
        // Activity tablosundan bildirimleri getir
        const activities = await Activity.find({
            $or: [
                { relatedUser: userId },
                { user: userId }
            ]
        })
        .populate('user', 'name email avatar')
        .populate('relatedUser', 'name email avatar')
        .populate('relatedTask', 'title')
        .sort({ createdAt: -1 })
        .limit(50);
        
        // Activity'leri notification formatına çevir
        const notifications = activities.map(activity => {
            let notificationType = 'info';
            let title = activity.action || 'Bildirim';
            
            // Tip belirleme
            if (activity.activityType === 'nudge') {
                notificationType = 'nudge';
                title = 'Dürtüldünüz!';
            } else if (activity.activityType === 'task_created') {
                notificationType = 'task';
                title = 'Yeni Görev';
            } else if (activity.activityType === 'task_approved') {
                notificationType = 'approval';
                title = 'Görev Onaylandı';
            } else if (activity.activityType === 'task_rejected') {
                notificationType = 'rejection';
                title = 'Görev Reddedildi';
            } else if (activity.activityType === 'task_completed') {
                notificationType = 'task';
                title = 'Görev Tamamlandı';
            }
            
            return {
                _id: activity._id,
                type: notificationType,
                title: title,
                message: activity.message,
                read: activity.read || false,
                createdAt: activity.createdAt,
                relatedTask: activity.relatedTask?._id,
                sender: activity.user ? {
                    name: activity.user.name,
                    email: activity.user.email,
                    avatar: activity.user.avatar
                } : null
            };
        });
        
        res.json(notifications);
    } catch (err) {
        console.error('Bildirimler yüklenirken hata:', err.message);
        res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
    }
});

// Bildirimi okundu olarak işaretle
router.put('/:notificationId/read', async (req, res) => {
    try {
        const Activity = require('../models/Activity');
        
        const activity = await Activity.findByIdAndUpdate(
            req.params.notificationId,
            { read: true },
            { new: true }
        );
        
        if (!activity) {
            return res.status(404).json({ msg: 'Bildirim bulunamadı' });
        }
        
        res.json({ msg: 'Bildirim okundu olarak işaretlendi' });
    } catch (err) {
        console.error('Bildirim güncelleme hatası:', err.message);
        res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
    }
});

// Tüm bildirimleri okundu olarak işaretle
router.put('/:userId/read-all', async (req, res) => {
    try {
        const userId = req.params.userId;
        const Activity = require('../models/Activity');
        
        await Activity.updateMany(
            {
                $or: [
                    { relatedUser: userId },
                    { user: userId }
                ]
            },
            { read: true }
        );
        
        res.json({ msg: 'Tüm bildirimler okundu olarak işaretlendi' });
    } catch (err) {
        console.error('Bildirimler güncelleme hatası:', err.message);
        res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
    }
});

// Bildirimi sil
router.delete('/:notificationId', async (req, res) => {
    try {
        const Activity = require('../models/Activity');
        
        const activity = await Activity.findByIdAndDelete(req.params.notificationId);
        
        if (!activity) {
            return res.status(404).json({ msg: 'Bildirim bulunamadı' });
        }
        
        res.json({ msg: 'Bildirim silindi' });
    } catch (err) {
        console.error('Bildirim silme hatası:', err.message);
        res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
    }
});

// Okunmuş bildirimleri sil
router.delete('/:userId/delete-read', async (req, res) => {
    try {
        const userId = req.params.userId;
        const Activity = require('../models/Activity');
        
        await Activity.deleteMany({
            $or: [
                { relatedUser: userId },
                { user: userId }
            ],
            read: true
        });
        
        res.json({ msg: 'Okunmuş bildirimler silindi' });
    } catch (err) {
        console.error('Bildirimler silme hatası:', err.message);
        res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
    }
});

module.exports = router; 
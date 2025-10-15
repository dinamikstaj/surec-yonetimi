// backend/routes/usersRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// Multer storage config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/avatars'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Tüm kullanıcıları getir
router.get('/', async (req, res) => {
    try {
        console.log('Tüm kullanıcılar getiriliyor...');
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        console.log(`${users.length} kullanıcı bulundu`);
        res.json(users);
    } catch (err) {
        console.error('Kullanıcılar getirilemedi:', err.message);
        res.status(500).json({ msg: 'Sunucu hatası' });
    }
});

// Yeni kullanıcı ekleme
router.post('/', async (req, res) => {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password || !phone || !role) {
        return res.status(400).json({ msg: 'Tüm alanlar zorunludur.' });
    }

    try {
        let existingUser = await User.findOne({ $or: [{ username: email }, { email: email }] });
        if (existingUser) return res.status(400).json({ msg: 'Bu e-posta zaten kayıtlı.' });

        console.log('Yeni kullanıcı oluşturuluyor:', { name, email, role, passwordLength: password.length });

        // Manuel hash'leme (güvenlik için)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log('Manuel hash oluşturuldu, uzunluk:', hashedPassword.length);

        const newUser = new User({
            name,
            username: email,
            email,
            password: hashedPassword, // Manuel olarak hash'lenmiş şifre
            phone,
            role: role === 'kullanıcı' ? 'kullanici' : role
        });

        console.log('User save öncesi password:', password.substring(0, 3) + '***');
        await newUser.save();
        console.log('User save sonrası password hash:', newUser.password.substring(0, 10) + '***');
        
        // Password'u response'dan çıkar
        const userResponse = newUser.toObject();
        delete userResponse.password;
        
        res.status(201).json({ msg: 'Kullanıcı başarıyla oluşturuldu.', user: userResponse });
    } catch (err) {
        console.error('Kullanıcı oluşturma hatası:', err.message);
        res.status(500).send('Sunucu hatası: ' + err.message);
    }
});

// Kullanıcıyı id ile getir
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'Kullanıcı bulunamadı.' });
        res.json(user);
    } catch (err) {
        console.error('Kullanıcı getirme hatası:', err.message);
        res.status(500).send('Sunucu hatası: ' + err.message);
    }
});

// Mevcut kullanıcı güncelleme
router.put('/:id', upload.single('avatar'), async (req, res) => {
    const { name, email, password, phone, role } = req.body;
    console.log('Profil güncelleme isteği:', {
        userId: req.params.id,
        body: req.body,
        file: req.file
    });

    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'Kullanıcı bulunamadı.' });

        // Güncelleme işlemleri
        user.name = name || user.name;
        user.email = email || user.email;
        user.username = email || user.username;
        user.phone = phone || user.phone;
        user.role = role || user.role;
        
        if (req.file) {
            user.avatar = `/avatars/${req.file.filename}`; // Doğru path
        }

        // Şifre güncellemesi - Pre-save hook'un çalışması için sadece değeri set et
        if (password && password.trim() !== '') {
            user.password = password; // Pre-save hook bu şifreyi hashleyecek
        }

        await user.save();

        // Etkinlik kaydı oluştur
        await createActivity(req.params.id, `Profil bilgileri güncellendi`, user.email);

        res.json({ msg: 'Kullanıcı güncellendi.', user });
    } catch (err) {
        console.error('Kullanıcı güncelleme hatası:', err.message);
        res.status(500).send('Sunucu hatası: ' + err.message);
    }
});

// Şifre değiştirme endpoint'i
router.post('/:id/change-password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ msg: 'Mevcut şifre ve yeni şifre gereklidir.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ msg: 'Yeni şifre en az 6 karakter olmalıdır.' });
    }

    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'Kullanıcı bulunamadı.' });

        // Mevcut şifre kontrolü
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ msg: 'Mevcut şifre yanlış.' });
        }

        // Yeni şifre aynı mı kontrol et
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ msg: 'Yeni şifre mevcut şifreden farklı olmalıdır.' });
        }

        // Yeni şifreyi set et (pre-save hook hashleyecek)
        user.password = newPassword;
        await user.save();

        // Etkinlik kaydı oluştur
        await createActivity(req.params.id, `Şifre değiştirildi`, user.email);

        res.json({ msg: 'Şifre başarıyla değiştirildi.' });
    } catch (err) {
        console.error('Şifre değiştirme hatası:', err.message);
        res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
    }
});

// Kullanıcı etkinlik geçmişi
router.get('/:id/activities', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'Kullanıcı bulunamadı.' });

        // Activity model'i import et
        const mongoose = require('mongoose');
        const Activity = mongoose.models.Activity || mongoose.model('Activity', new mongoose.Schema({
            message: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
            username: String,
            userId: String,
            actorId: String,
        }));

        // Kullanıcıya ait etkinlikleri getir (username ve userId ile eşleştir)
        const activities = await Activity.find({
            $or: [
                { username: user.email },
                { username: user.username },
                { userId: req.params.id }
            ]
        }).sort({ createdAt: -1 }).limit(50);

        res.json(activities);
    } catch (err) {
        console.error('Etkinlik geçmişi hatası:', err.message);
        res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
    }
});

// Etkinlik oluşturma helper fonksiyonu
async function createActivity(userId, message, username) {
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
            userId: userId.toString()
        });

        await newActivity.save();
        return newActivity;
    } catch (error) {
        console.error('Etkinlik oluşturma hatası:', error);
    }
}

// Kullanıcı silme
router.delete('/:id', async (req, res) => {
    try {
        console.log('Kullanıcı siliniyor:', req.params.id);
        
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'Kullanıcı bulunamadı' });
        }
        
        // Admin kullanıcının kendini silmesini engelle
        if (user.role === 'yonetici') {
            const adminCount = await User.countDocuments({ role: 'yonetici' });
            if (adminCount <= 1) {
                return res.status(400).json({ msg: 'Son yönetici hesabı silinemez' });
            }
        }
        
        await User.findByIdAndDelete(req.params.id);
        console.log('Kullanıcı silindi:', user.email);
        
        res.json({ msg: 'Kullanıcı başarıyla silindi' });
    } catch (err) {
        console.error('Kullanıcı silme hatası:', err.message);
        res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
    }
});

// Personel dürt (nudge) endpoint
router.post('/:id/nudge', async (req, res) => {
    try {
        const { message, senderId, taskId, taskTitle, motivationalMessage } = req.body;
        const userId = req.params.id;

        // Hedef kullanıcıyı bul
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ msg: 'Kullanıcı bulunamadı' });
        }

        // Gönderen kullanıcıyı bul
        const sender = await User.findById(senderId);
        if (!sender) {
            return res.status(404).json({ msg: 'Gönderen kullanıcı bulunamadı' });
        }

        // Motivasyon mesajları
        const defaultMotivationalMessages = [
            "💪 Hadi, bu işi bitirelim!",
            "🚀 Harikasın! Devam et!",
            "⚡ Hızlı ol, başarı yakın!",
            "🎯 Odaklan, tamamlayabilirsin!",
            "🔥 Sen yaparsın, inanıyorum!",
            "⭐ Mükemmel bir iş çıkarıyorsun!",
            "💯 Biraz daha, neredeyse bitti!",
            "🏆 Şampiyon gibi çalış!"
        ];

        const finalMotivationalMessage = motivationalMessage || 
            defaultMotivationalMessages[Math.floor(Math.random() * defaultMotivationalMessages.length)];

        // Activity kaydı oluştur
        const Activity = require('../models/Activity');
        const activityMessage = taskTitle 
            ? `${sender.name || sender.email} tarafından dürtüldü (Görev: ${taskTitle})`
            : `${sender.name || sender.email} tarafından dürtüldü`;
        
        await Activity.create({
            action: 'Dürtüldü',
            message: activityMessage,
            user: senderId,
            relatedUser: userId,
            relatedTask: taskId || null,
            activityType: 'nudge',
            details: message,
            metadata: {
                motivationalMessage: finalMotivationalMessage,
                taskTitle: taskTitle
            }
        });

        // Socket.io ile gerçek zamanlı bildirim gönder - sadece hedef kullanıcıya
        const io = req.app.get('io');
        if (io) {
            // Sadece hedef kullanıcıya gönder (çift mesaj önleme)
            io.to(`user_${userId}`).emit('nudge_notification', {
                userId: userId,
                message: message || `${sender.name || sender.email} sizi dürtüyor!`,
                senderName: sender.name || sender.email,
                senderId: senderId,
                taskId: taskId,
                taskTitle: taskTitle,
                motivationalMessage: finalMotivationalMessage,
                targetUserSound: targetUser.notificationSound,
                timestamp: new Date().toISOString()
            });
            console.log('Dürt bildirimi gönderildi:', targetUser.email, `Ses: ${targetUser.notificationSound || 'none'}`, taskTitle ? `- Görev: ${taskTitle}` : '');
        }

        res.json({ 
            msg: 'Dürt başarıyla gönderildi',
            targetUser: targetUser.name || targetUser.email
        });
    } catch (err) {
        console.error('Dürt gönderme hatası:', err.message);
        res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
    }
});

// Kullanıcı detaylı analizleri endpoint
router.get('/:id/analytics', async (req, res) => {
    try {
        const userId = req.params.id;
        const Task = require('../models/Task');
        
        // Tüm görevleri getir
        const allTasks = await Task.find({ assignedTo: userId });
        
        // Tamamlanan görevler
        const completedTasks = allTasks.filter(t => t.status === 'completed');
        
        // Gecikmeli görevler (tamamlanmamış ve bitiş tarihi geçmiş)
        const overdueTasks = allTasks.filter(t => {
            if (!t.dueDate || t.status === 'completed' || t.status === 'cancelled') return false;
            return new Date(t.dueDate) < new Date();
        });
        
        // Zamanında tamamlanan görevler
        const onTimeTasks = completedTasks.filter(t => {
            if (!t.dueDate || !t.completedAt) return false;
            return new Date(t.completedAt) <= new Date(t.dueDate);
        });
        
        // Gecikmiş tamamlanan görevler
        const lateTasks = completedTasks.filter(t => {
            if (!t.dueDate || !t.completedAt) return false;
            return new Date(t.completedAt) > new Date(t.dueDate);
        });
        
        // Öncelik bazlı istatistikler
        const priorityStats = {
            urgent: {
                total: allTasks.filter(t => t.priority === 'urgent').length,
                completed: completedTasks.filter(t => t.priority === 'urgent').length,
            },
            high: {
                total: allTasks.filter(t => t.priority === 'high').length,
                completed: completedTasks.filter(t => t.priority === 'high').length,
            },
            medium: {
                total: allTasks.filter(t => t.priority === 'medium').length,
                completed: completedTasks.filter(t => t.priority === 'medium').length,
            },
            low: {
                total: allTasks.filter(t => t.priority === 'low').length,
                completed: completedTasks.filter(t => t.priority === 'low').length,
            }
        };
        
        // Dürtülme sayısı (Activity modelinden)
        const Activity = require('../models/Activity');
        let nudgeCount = 0;
        try {
            nudgeCount = await Activity.countDocuments({
                relatedUser: userId,
                action: { $regex: /dürt/i }
            });
        } catch (err) {
            console.log('Activity model bulunamadı, nudge sayısı 0 olarak ayarlandı');
        }
        
        // Ortalama tamamlanma süresi (dinamik: saat/gün/hafta)
        let avgCompletionTime = 0;
        let avgCompletionTimeUnit = 'gün';
        if (completedTasks.length > 0) {
            const completionTimes = completedTasks
                .filter(t => t.createdAt && t.completedAt)
                .map(t => {
                    const created = new Date(t.createdAt);
                    const completed = new Date(t.completedAt);
                    return (completed.getTime() - created.getTime()) / (1000 * 60 * 60); // Saat cinsinden
                });
            
            if (completionTimes.length > 0) {
                const avgHours = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
                
                // Dinamik birim seç
                if (avgHours < 24) {
                    avgCompletionTime = Math.round(avgHours * 10) / 10;
                    avgCompletionTimeUnit = 'saat';
                } else if (avgHours < 168) { // 7 gün
                    avgCompletionTime = Math.round((avgHours / 24) * 10) / 10;
                    avgCompletionTimeUnit = 'gün';
                } else {
                    avgCompletionTime = Math.round((avgHours / 168) * 10) / 10;
                    avgCompletionTimeUnit = 'hafta';
                }
            }
        }
        
        // Aylık performans trendi (son 6 ay)
        const monthlyPerformance = [];
        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date();
            monthDate.setMonth(monthDate.getMonth() - i);
            const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
            const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
            
            const monthTasks = allTasks.filter(t => {
                const createdDate = new Date(t.createdAt);
                return createdDate >= monthStart && createdDate <= monthEnd;
            });
            
            const monthCompleted = monthTasks.filter(t => t.status === 'completed').length;
            
            monthlyPerformance.push({
                month: monthDate.toLocaleDateString('tr-TR', { month: 'short' }),
                total: monthTasks.length,
                completed: monthCompleted,
                completionRate: monthTasks.length > 0 ? Math.round((monthCompleted / monthTasks.length) * 100) : 0
            });
        }
        
        // Haftalık aktivite (son 4 hafta)
        const weeklyActivity = [];
        for (let i = 3; i >= 0; i--) {
            const weekEnd = new Date();
            weekEnd.setDate(weekEnd.getDate() - (i * 7));
            const weekStart = new Date(weekEnd);
            weekStart.setDate(weekStart.getDate() - 7);
            
            const weekTasks = allTasks.filter(t => {
                const createdDate = new Date(t.createdAt);
                return createdDate >= weekStart && createdDate <= weekEnd;
            });
            
            const weekCompleted = weekTasks.filter(t => t.status === 'completed').length;
            
            weeklyActivity.push({
                week: `Hafta ${4 - i}`,
                tasksCreated: weekTasks.length,
                tasksCompleted: weekCompleted
            });
        }
        
        // Performans skoru hesaplama (0-100)
        const completionRate = allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0;
        const onTimeRate = completedTasks.length > 0 ? (onTimeTasks.length / completedTasks.length) * 100 : 0;
        const overdueRate = allTasks.length > 0 ? (overdueTasks.length / allTasks.length) * 100 : 0;
        
        const performanceScore = Math.round(
            (completionRate * 0.4) + 
            (onTimeRate * 0.4) + 
            ((100 - overdueRate) * 0.2)
        );
        
        // Güçlü yönler ve gelişim alanları hesapla
        const insights = {
            strengths: [],
            improvements: []
        };
        
        if (onTimeRate >= 80) {
            insights.strengths.push('Görevleri zamanında tamamlama oranı çok yüksek');
        }
        if (completionRate >= 75) {
            insights.strengths.push('Görev tamamlama oranı mükemmel seviyede');
        }
        if (nudgeCount === 0) {
            insights.strengths.push('Hiç dürtülmeden görevleri tamamlıyor');
        }
        if (priorityStats.urgent.total > 0 && priorityStats.urgent.completed / priorityStats.urgent.total >= 0.9) {
            insights.strengths.push('Acil görevlerde yüksek başarı oranı');
        }
        
        if (overdueTasks.length > 3) {
            insights.improvements.push('Geciken görev sayısını azaltmaya çalışın');
        }
        if (nudgeCount > 5) {
            insights.improvements.push('Dürtülme sayısını azaltmak için proaktif olun');
        }
        if (onTimeRate < 50) {
            insights.improvements.push('Görevleri belirlenen sürede tamamlamaya odaklanın');
        }
        if (avgCompletionTime > 7) {
            insights.improvements.push('Görev tamamlanma süresini kısaltmayı deneyin');
        }
        
        console.log('Analytics Response:', {
            totalTasks: allTasks.length,
            completedTasks: completedTasks.length,
            nudgeCount,
            insights
        });
        
        // Response gönder
        res.json({
            summary: {
                totalTasks: allTasks.length,
                completedTasks: completedTasks.length,
                inProgressTasks: allTasks.filter(t => t.status === 'in-progress').length,
                pendingTasks: allTasks.filter(t => t.status === 'pending').length,
                overdueTasks: overdueTasks.length,
                completionRate: Math.round(completionRate),
                onTimeTasks: onTimeTasks.length,
                lateTasks: lateTasks.length,
                onTimeRate: Math.round(onTimeRate),
                nudgeCount: nudgeCount,
                avgCompletionTime: avgCompletionTime,
                avgCompletionTimeUnit: avgCompletionTimeUnit,
                performanceScore: performanceScore
            },
            priorityStats,
            monthlyPerformance,
            weeklyActivity,
            insights
        });
        
    } catch (err) {
        console.error('Analiz hatası:', err.message);
        res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
    }
});

// Kullanıcı başarıları endpoint
router.get('/:id/achievements', async (req, res) => {
    try {
        const userId = req.params.id;
        const Task = require('../models/Task');
        const Activity = require('../models/Activity');
        
        // Görevleri getir
        const allTasks = await Task.find({ assignedTo: userId });
        const completedTasks = allTasks.filter(t => t.status === 'completed');
        
        // Dürtülme sayısı
        let nudgeCount = 0;
        try {
            nudgeCount = await Activity.countDocuments({
                relatedUser: userId,
                action: { $regex: /dürt/i }
            });
        } catch (err) {
            console.log('Activity sayısı alınamadı');
        }
        
        // Zamanında tamamlanan görevler
        const onTimeTasks = completedTasks.filter(t => {
            if (!t.dueDate || !t.completedAt) return false;
            return new Date(t.completedAt) <= new Date(t.dueDate);
        });
        
        const achievements = [
            {
                id: 'first_task',
                title: 'İlk Adım',
                description: 'İlk görevini tamamladın!',
                icon: 'star',
                unlocked: completedTasks.length >= 1,
                unlockedAt: completedTasks.length >= 1 ? completedTasks[0].completedAt : null,
                progress: Math.min(completedTasks.length, 1),
                target: 1
            },
            {
                id: 'task_master_5',
                title: 'Başlangıç Seviyesi',
                description: '5 görev tamamla',
                icon: 'medal',
                unlocked: completedTasks.length >= 5,
                unlockedAt: completedTasks.length >= 5 ? completedTasks[4].completedAt : null,
                progress: Math.min(completedTasks.length, 5),
                target: 5
            },
            {
                id: 'task_master_10',
                title: 'Görev Ustası',
                description: '10 görev tamamla',
                icon: 'trophy',
                unlocked: completedTasks.length >= 10,
                unlockedAt: completedTasks.length >= 10 ? completedTasks[9].completedAt : null,
                progress: Math.min(completedTasks.length, 10),
                target: 10
            },
            {
                id: 'task_master_25',
                title: 'Profesyonel',
                description: '25 görev tamamla',
                icon: 'award',
                unlocked: completedTasks.length >= 25,
                unlockedAt: completedTasks.length >= 25 ? completedTasks[24].completedAt : null,
                progress: Math.min(completedTasks.length, 25),
                target: 25
            },
            {
                id: 'task_master_50',
                title: 'Efsane',
                description: '50 görev tamamla',
                icon: 'trophy',
                unlocked: completedTasks.length >= 50,
                unlockedAt: completedTasks.length >= 50 ? completedTasks[49].completedAt : null,
                progress: Math.min(completedTasks.length, 50),
                target: 50
            },
            {
                id: 'perfect_week',
                title: 'Mükemmel Hafta',
                description: 'Bir hafta içinde tüm görevleri zamanında tamamla',
                icon: 'flame',
                unlocked: onTimeTasks.length >= 5 && completedTasks.length >= 5,
                unlockedAt: onTimeTasks.length >= 5 ? new Date() : null,
                progress: Math.min(onTimeTasks.length, 5),
                target: 5
            },
            {
                id: 'on_time_master',
                title: 'Zamanlama Şampiyonu',
                description: '10 görevi zamanında tamamla',
                icon: 'zap',
                unlocked: onTimeTasks.length >= 10,
                unlockedAt: onTimeTasks.length >= 10 ? onTimeTasks[9].completedAt : null,
                progress: Math.min(onTimeTasks.length, 10),
                target: 10
            },
            {
                id: 'no_nudge',
                title: 'Proaktif',
                description: 'Hiç dürtülmeden 10 görev tamamla',
                icon: 'target',
                unlocked: nudgeCount === 0 && completedTasks.length >= 10,
                unlockedAt: nudgeCount === 0 && completedTasks.length >= 10 ? new Date() : null,
                progress: nudgeCount === 0 ? Math.min(completedTasks.length, 10) : 0,
                target: 10
            },
            {
                id: 'speed_demon',
                title: 'Hız Canavarı',
                description: 'Bir görevi 24 saat içinde tamamla',
                icon: 'zap',
                unlocked: completedTasks.some(t => {
                    if (!t.createdAt || !t.completedAt) return false;
                    const diff = new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime();
                    return diff < 24 * 60 * 60 * 1000;
                }),
                unlockedAt: completedTasks.find(t => {
                    if (!t.createdAt || !t.completedAt) return false;
                    const diff = new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime();
                    return diff < 24 * 60 * 60 * 1000;
                })?.completedAt || null,
                progress: completedTasks.filter(t => {
                    if (!t.createdAt || !t.completedAt) return false;
                    const diff = new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime();
                    return diff < 24 * 60 * 60 * 1000;
                }).length >= 1 ? 1 : 0,
                target: 1
            },
            {
                id: 'urgent_master',
                title: 'Acil Durum Kahramanı',
                description: '5 acil görevi başarıyla tamamla',
                icon: 'flame',
                unlocked: completedTasks.filter(t => t.priority === 'urgent').length >= 5,
                unlockedAt: completedTasks.filter(t => t.priority === 'urgent').length >= 5 
                    ? completedTasks.filter(t => t.priority === 'urgent')[4].completedAt 
                    : null,
                progress: Math.min(completedTasks.filter(t => t.priority === 'urgent').length, 5),
                target: 5
            }
        ];
        
        res.json(achievements);
    } catch (err) {
        console.error('Başarılar yükleme hatası:', err.message);
        res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
    }
});

// E-posta adreslerine göre ses ataması yap
router.post('/assign-sounds-by-email', async (req, res) => {
  try {
    console.log('🎵 E-posta adreslerine göre ses ataması başlatılıyor...');
    
    // Tüm kullanıcıları getir
    const users = await User.find({});
    let updatedCount = 0;
    
    for (const user of users) {
      const email = user.email?.toLowerCase();
      let newSound = null;
      
      // E-posta adresine göre ses ataması
      if (email?.includes('muharrem@dinamikotomasyon.com')) {
        newSound = 'muharrreeeeem';
      } else if (email?.includes('ibrahimkilic@dinamikotomasyon.com')) {
        newSound = 'ibraaaamabi';
      } else if (email?.includes('hamza@dinamikotomasyon.com')) {
        newSound = 'hamzaaa';
      } else if (email?.includes('selcuk@dinamikotomasyon.com')) {
        newSound = 'lokmalaaaa';
      }
      
      // Eğer eşleşme varsa güncelle
      if (newSound && user.notificationSound !== newSound) {
        await User.findByIdAndUpdate(user._id, { notificationSound: newSound });
        console.log(`🎵 ${user.name} (${user.email}) → ${newSound} sesi atandı`);
        updatedCount++;
      }
    }
    
    res.json({ 
      success: true, 
      message: `${updatedCount} kullanıcının sesi güncellendi`,
      updatedCount 
    });
    
  } catch (error) {
    console.error('Ses atama hatası:', error);
    res.status(500).json({ msg: 'Ses atama başarısız', error: error.message });
  }
});

module.exports = router;

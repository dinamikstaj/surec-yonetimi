const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const User = require('../models/User');
const Activity = require('../models/Activity');

// Tüm sorunları getir (filtreleme ile)
router.get('/', async (req, res) => {
    try {
        const { status, date, assignedTo } = req.query;
        
        let query = {};
        
        // Durum filtresi
        if (status === 'resolved') {
            query.status = 'resolved';
        } else if (status === 'unresolved') {
            query.status = { $in: ['open', 'in-progress'] };
        } else if (status && status !== 'all') {
            query.status = status;
        }
        
        // Tarih filtresi
        if (date) {
            const selectedDate = new Date(date);
            const nextDay = new Date(selectedDate);
            nextDay.setDate(nextDay.getDate() + 1);
            
            query.createdAt = {
                $gte: selectedDate,
                $lt: nextDay
            };
        }
        
        // Atanan kişi filtresi
        if (assignedTo && assignedTo !== 'all') {
            query.assignedTo = assignedTo;
        }
        
        const issues = await Issue.find(query)
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name email avatar')
            .populate('resolvedBy', 'name email')
            .populate('customer', 'company name')
            .sort({ createdAt: -1 });
        
        res.json(issues);
    } catch (err) {
        console.error('Sorunlar yüklenirken hata:', err.message);
        res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
    }
});

// Yeni sorun oluştur
router.post('/', async (req, res) => {
    try {
        const { title, description, customer, customerName, priority, category, dueDate, assignedTo } = req.body;
        const createdBy = req.body.createdBy;
        
        if (!title || !description || !createdBy) {
            return res.status(400).json({ msg: 'Başlık, açıklama ve oluşturan kişi zorunludur' });
        }
        
        const newIssue = new Issue({
            title,
            description,
            customer,
            customerName,
            priority: priority || 'medium',
            category: category || 'other',
            dueDate,
            assignedTo: assignedTo || [],
            createdBy,
            status: 'open'
        });
        
        await newIssue.save();
        
        // Activity kaydı oluştur
        await Activity.create({
            action: 'Sorun Oluşturuldu',
            message: `Yeni sorun: "${title}"`,
            user: createdBy,
            activityType: 'other',
            metadata: {
                issueId: newIssue._id,
                issueTitle: title
            }
        });
        
        // Socket.io bildirimi (eğer atama yapıldıysa)
        if (assignedTo && assignedTo.length > 0) {
            const io = req.app.get('io');
            if (io) {
                assignedTo.forEach(userId => {
                    io.emit('new_issue_assigned', {
                        userId: userId,
                        issueId: newIssue._id,
                        title: title,
                        message: `Size yeni bir sorun atandı: "${title}"`
                    });
                });
            }
        }
        
        const populatedIssue = await Issue.findById(newIssue._id)
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name email avatar')
            .populate('customer', 'company name');
        
        res.status(201).json(populatedIssue);
    } catch (err) {
        console.error('Sorun oluşturma hatası:', err.message);
        res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
    }
});

// Sorunu güncelle
router.put('/:id', async (req, res) => {
    try {
        const { title, description, status, priority, category, dueDate, assignedTo } = req.body;
        
        const issue = await Issue.findById(req.params.id);
        if (!issue) {
            return res.status(404).json({ msg: 'Sorun bulunamadı' });
        }
        
        // Eğer çözüldü olarak işaretleniyorsa
        if (status === 'resolved' && issue.status !== 'resolved') {
            issue.resolvedAt = Date.now();
            issue.resolvedBy = req.body.resolvedBy;
        }
        
        if (title) issue.title = title;
        if (description) issue.description = description;
        if (status) issue.status = status;
        if (priority) issue.priority = priority;
        if (category) issue.category = category;
        if (dueDate !== undefined) issue.dueDate = dueDate;
        if (assignedTo !== undefined) issue.assignedTo = assignedTo;
        
        await issue.save();
        
        const updatedIssue = await Issue.findById(issue._id)
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name email avatar')
            .populate('resolvedBy', 'name email')
            .populate('customer', 'company name');
        
        res.json(updatedIssue);
    } catch (err) {
        console.error('Sorun güncelleme hatası:', err.message);
        res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
    }
});

// Personel kendini atama/çıkarma
router.post('/:id/self-assign', async (req, res) => {
    try {
        const { userId, action } = req.body; // action: 'assign' veya 'unassign'
        
        const issue = await Issue.findById(req.params.id);
        if (!issue) {
            return res.status(404).json({ msg: 'Sorun bulunamadı' });
        }
        
        if (action === 'assign') {
            // Kendini ekle
            if (!issue.assignedTo.includes(userId)) {
                issue.assignedTo.push(userId);
                
                // Activity kaydı
                await Activity.create({
                    action: 'Soruna Atandı',
                    message: `Kullanıcı soruna kendini atadı: "${issue.title}"`,
                    user: userId,
                    activityType: 'other',
                    metadata: {
                        issueId: issue._id,
                        issueTitle: issue.title
                    }
                });
            }
        } else if (action === 'unassign') {
            // Kendini çıkar
            issue.assignedTo = issue.assignedTo.filter(id => id.toString() !== userId.toString());
            
            // Activity kaydı
            await Activity.create({
                action: 'Sorundan Çıkarıldı',
                message: `Kullanıcı sorundan kendini çıkardı: "${issue.title}"`,
                user: userId,
                activityType: 'other',
                metadata: {
                    issueId: issue._id,
                    issueTitle: issue.title
                }
            });
        }
        
        await issue.save();
        
        const updatedIssue = await Issue.findById(issue._id)
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name email avatar')
            .populate('customer', 'company name');
        
        res.json(updatedIssue);
    } catch (err) {
        console.error('Self-assign hatası:', err.message);
        res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
    }
});

// Soruna not ekle
router.post('/:id/notes', async (req, res) => {
    try {
        const { userId, text } = req.body;
        
        const issue = await Issue.findById(req.params.id);
        if (!issue) {
            return res.status(404).json({ msg: 'Sorun bulunamadı' });
        }
        
        issue.notes.push({
            user: userId,
            text,
            createdAt: Date.now()
        });
        
        await issue.save();
        
        const updatedIssue = await Issue.findById(issue._id)
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name email avatar')
            .populate('notes.user', 'name email avatar');
        
        res.json(updatedIssue);
    } catch (err) {
        console.error('Not ekleme hatası:', err.message);
        res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
    }
});

// Sorunu sil
router.delete('/:id', async (req, res) => {
    try {
        const issue = await Issue.findByIdAndDelete(req.params.id);
        
        if (!issue) {
            return res.status(404).json({ msg: 'Sorun bulunamadı' });
        }
        
        res.json({ msg: 'Sorun silindi' });
    } catch (err) {
        console.error('Sorun silme hatası:', err.message);
        res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
    }
});

// Soruna dosya ekle
router.post('/:id/attachments', async (req, res) => {
    try {
        const { name, path, uploadedBy } = req.body;
        
        const issue = await Issue.findById(req.params.id);
        if (!issue) {
            return res.status(404).json({ msg: 'Sorun bulunamadı' });
        }
        
        issue.attachments.push({
            name,
            path,
            uploadedBy,
            uploadedAt: Date.now()
        });
        
        await issue.save();
        
        const updatedIssue = await Issue.findById(issue._id)
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name email avatar')
            .populate('notes.user', 'name email avatar')
            .populate('attachments.uploadedBy', 'name email avatar');
        
        res.json(updatedIssue);
    } catch (err) {
        console.error('Dosya ekleme hatası:', err.message);
        res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
    }
});

// Dosya sil
router.delete('/:id/attachments/:attachmentId', async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);
        if (!issue) {
            return res.status(404).json({ msg: 'Sorun bulunamadı' });
        }
        
        issue.attachments = issue.attachments.filter(
            att => att._id.toString() !== req.params.attachmentId
        );
        
        await issue.save();
        
        const updatedIssue = await Issue.findById(issue._id)
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name email avatar')
            .populate('notes.user', 'name email avatar');
        
        res.json(updatedIssue);
    } catch (err) {
        console.error('Dosya silme hatası:', err.message);
        res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
    }
});

// İstatistikler endpoint'i
router.get('/stats/overview', async (req, res) => {
    try {
        const now = new Date();
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const totalIssues = await Issue.countDocuments();
        const openIssues = await Issue.countDocuments({ status: 'open' });
        const inProgressIssues = await Issue.countDocuments({ status: 'in-progress' });
        const resolvedIssues = await Issue.countDocuments({ status: 'resolved' });
        const closedIssues = await Issue.countDocuments({ status: 'closed' });
        
        const issuesLast7Days = await Issue.countDocuments({ 
            createdAt: { $gte: last7Days } 
        });
        const issuesLast30Days = await Issue.countDocuments({ 
            createdAt: { $gte: last30Days } 
        });
        
        const resolvedLast7Days = await Issue.countDocuments({ 
            resolvedAt: { $gte: last7Days } 
        });
        
        // Ortalama çözüm süresi (saat cinsinden)
        const resolvedWithTime = await Issue.find({
            status: 'resolved',
            resolvedAt: { $exists: true }
        }).select('createdAt resolvedAt');
        
        let avgResolutionTime = 0;
        if (resolvedWithTime.length > 0) {
            const totalTime = resolvedWithTime.reduce((sum, issue) => {
                const diff = new Date(issue.resolvedAt) - new Date(issue.createdAt);
                return sum + diff;
            }, 0);
            avgResolutionTime = totalTime / resolvedWithTime.length / (1000 * 60 * 60); // saat
        }
        
        // Kategori dağılımı
        const categoryStats = await Issue.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);
        
        // Öncelik dağılımı
        const priorityStats = await Issue.aggregate([
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);
        
        res.json({
            total: totalIssues,
            open: openIssues,
            inProgress: inProgressIssues,
            resolved: resolvedIssues,
            closed: closedIssues,
            last7Days: issuesLast7Days,
            last30Days: issuesLast30Days,
            resolvedLast7Days,
            avgResolutionTimeHours: Math.round(avgResolutionTime * 10) / 10,
            categoryStats,
            priorityStats
        });
    } catch (err) {
        console.error('İstatistik hatası:', err.message);
        res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
    }
});

// Tek sorun detayını getir
router.get('/:id', async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id)
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name email avatar')
            .populate('resolvedBy', 'name email')
            .populate('customer', 'company name')
            .populate('notes.user', 'name email avatar')
            .populate('attachments.uploadedBy', 'name email avatar');
        
        if (!issue) {
            return res.status(404).json({ msg: 'Sorun bulunamadı' });
        }
        
        res.json(issue);
    } catch (err) {
        console.error('Sorun detayı yüklenirken hata:', err.message);
        res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
    }
});

module.exports = router;

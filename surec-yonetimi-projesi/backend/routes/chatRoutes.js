const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const Chat = require('../models/Chat');
const User = require('../models/User');

// ========================
// MULTER CONFIGURATION
// ========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/chat';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Desteklenmeyen dosya türü!'));
    }
  }
});

router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'Dosya seçilmedi' });
    }
    
    res.json({
      success: true,
      fileUrl: `/uploads/chat/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype
    });
  } catch (error) {
    console.error('Dosya yükleme hatası:', error);
    res.status(500).json({ msg: 'Dosya yüklenemedi', error: error.message });
  }
});

// ========================
// USER STATUS
// ========================
router.put('/user/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { statusMessage } = req.body;
    
    if (!statusMessage || statusMessage.trim().length === 0) {
      return res.status(400).json({ msg: 'Durum mesajı gerekli' });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { statusMessage: statusMessage.trim() },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ msg: 'Kullanıcı bulunamadı' });
    }
    
    res.json({
      success: true,
      statusMessage: user.statusMessage
    });
  } catch (error) {
    console.error('Status message update error:', error);
    res.status(500).json({ msg: 'Durum mesajı güncellenemedi', error: error.message });
  }
});

// Update notification sound
router.put('/user/:userId/notification-sound', async (req, res) => {
  try {
    const { userId } = req.params;
    const { notificationSound } = req.body;
    
    const validSounds = ['hamzaaa', 'ibraaaamabi', 'lokmalaaaa', 'muharrreeeeem'];
    if (!validSounds.includes(notificationSound)) {
      return res.status(400).json({ msg: 'Geçersiz bildirim sesi' });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { notificationSound },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ msg: 'Kullanıcı bulunamadı' });
    }
    
    res.json({
      success: true,
      notificationSound: user.notificationSound
    });
  } catch (error) {
    console.error('Notification sound update error:', error);
    res.status(500).json({ msg: 'Bildirim sesi güncellenemedi', error: error.message });
  }
});

// ========================
// ONLINE STATUS - DEPRECATED (Socket handles this now)
// ========================
// Online status artık socket connect/disconnect ile otomatik yönetiliyor
// Bu endpoint sadece backward compatibility için tutuluyor
router.put('/user/:userId/online', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Online status is now handled by socket connection'
    });
  } catch (error) {
    console.error('Update online status error:', error);
    res.status(500).json({ msg: 'Durum güncellenemedi', error: error.message });
  }
});

// ========================
// GET ALL USERS - GERÇEK ONLINE DURUMU
// ========================
router.get('/all-users', async (req, res) => {
  try {
    const { excludeUserId } = req.query;
    const query = excludeUserId ? { _id: { $ne: excludeUserId } } : {};
    
    // Database'den kullanıcıları al (isOnline zaten socket tarafından güncelleniyor)
    const users = await User.find(query)
      .select('name email avatar role lastLogin lastSeen isOnline statusMessage notificationSound')
      .sort({ isOnline: -1, lastSeen: -1 }); // Online olanlar önce, sonra lastSeen'e göre
    
    // Gerçek online durumu - Database'deki isOnline değerini kullan
    const usersWithRealStatus = users.map(user => ({
      ...user.toObject(),
      // isOnline database'den geliyor, değiştirme!
    }));
    
    res.json(usersWithRealStatus);
  } catch (error) {
    console.error('All users fetch error:', error);
    res.status(500).json({ msg: 'Kullanıcılar getirilemedi', error: error.message });
  }
});

// ========================
// GET USER CHATS
// ========================
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const chats = await Chat.find({ participants: userId })
      .populate('participants', 'name email avatar role isOnline lastSeen')
      .populate('messages.sender', 'name email avatar')
      .sort({ lastMessageTime: -1 });
    
    // Filter deleted messages
    const chatsWithFilteredMessages = chats.map(chat => {
      const chatObj = chat.toObject();
      chatObj.messages = chatObj.messages.filter(msg => !msg.isDeleted);
      return chatObj;
    });
    
    res.json(chatsWithFilteredMessages);
  } catch (error) {
    console.error('Chats fetch error:', error);
    res.status(500).json({ msg: 'Sohbetler getirilemedi', error: error.message });
  }
});

// ========================
// GET UNREAD COUNT
// ========================
router.get('/user/:userId/unread-count', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const chats = await Chat.find({ participants: userId });
    
    let totalUnread = 0;
    chats.forEach(chat => {
      const count = chat.unreadCount.get(userId.toString()) || 0;
      totalUnread += count;
    });
    
    res.json({ unreadCount: totalUnread });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ msg: 'Okunmamış sayısı alınamadı', error: error.message });
  }
});

// ========================
// GET OR CREATE CHAT
// ========================
router.post('/get-or-create', async (req, res) => {
  try {
    const { userId1, userId2 } = req.body;
    
    if (!userId1 || !userId2) {
      return res.status(400).json({ msg: 'İki kullanıcı ID gerekli' });
    }
    
    // Check if chat exists
    let chat = await Chat.findOne({
      participants: { $all: [userId1, userId2] }
    })
    .populate('participants', 'name email avatar role isOnline lastSeen')
    .populate('messages.sender', 'name email avatar');
    
    // Create new chat if doesn't exist
    if (!chat) {
      chat = new Chat({
        participants: [userId1, userId2],
        messages: [],
        unreadCount: new Map([[userId1, 0], [userId2, 0]])
      });
      await chat.save();
      await chat.populate('participants', 'name email avatar role isOnline lastSeen');
    }
    
    // Filter deleted messages
    if (chat.messages) {
    chat.messages = chat.messages.filter(msg => !msg.isDeleted);
    }
    
    res.json(chat);
  } catch (error) {
    console.error('Get or create chat error:', error);
    res.status(500).json({ msg: 'Sohbet oluşturulamadı', error: error.message });
  }
});

// ========================
// SEND MESSAGE - YENİ VE TEMİZ
// ========================
router.post('/:chatId/message', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { senderId, content, type, fileName, fileSize, fileType, fileUrl } = req.body;
    
    if (!senderId || !content) {
      return res.status(400).json({ msg: 'Gönderen ve içerik gerekli' });
    }
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ msg: 'Sohbet bulunamadı' });
    }
    
    // Create new message
    const newMessage = {
      sender: senderId,
      content,
      type: type || 'text',
      fileName: fileName || null,
      fileSize: fileSize || null,
      fileType: fileType || null,
      fileUrl: fileUrl || null,
      status: 'sent',
      statusDetails: {
        sentAt: new Date(),
        deliveredAt: new Date(),
        readAt: null,
        readBy: []
      },
      read: false,
      createdAt: new Date()
    };
    
    // Add to chat
    chat.messages.push(newMessage);
    chat.lastMessage = content;
    chat.lastMessageTime = new Date();
    
    // Update unread count
    chat.participants.forEach(participantId => {
      if (participantId.toString() !== senderId.toString()) {
        const currentCount = chat.unreadCount.get(participantId.toString()) || 0;
        chat.unreadCount.set(participantId.toString(), currentCount + 1);
      }
    });
    
    await chat.save();
    
    // Get the saved message with its _id
    const savedMessage = chat.messages[chat.messages.length - 1];
    
    // Populate sender info
    await chat.populate('participants', 'name email avatar role isOnline lastSeen');
    await chat.populate('messages.sender', 'name email avatar');
    
    const populatedMessage = chat.messages[chat.messages.length - 1];
    
    // ✅ SADECE SOCKET İLE MESAJ GÖNDER - RESPONSE'TA GÖNDERME
    const io = req.app.get('io');
    if (io) {
      const messageData = {
        chatId: chat._id.toString(),
        message: {
          _id: populatedMessage._id,
          sender: populatedMessage.sender,
          content: populatedMessage.content,
          type: populatedMessage.type,
          fileName: populatedMessage.fileName,
          fileSize: populatedMessage.fileSize,
          fileType: populatedMessage.fileType,
          fileUrl: populatedMessage.fileUrl,
          status: populatedMessage.status,
          statusDetails: populatedMessage.statusDetails,
          read: populatedMessage.read,
          createdAt: populatedMessage.createdAt
        }
      };
      
      // Send ONLY to other participants (not sender - they have optimistic update)
      chat.participants.forEach(participantId => {
        if (participantId._id.toString() !== senderId.toString()) {
        const roomName = `user_${participantId._id}`;
          console.log(`📤 Sending message to: ${roomName}`);
        io.to(roomName).emit('new_message', messageData);
        }
      });
    }
    
    // ✅ SADECE SUCCESS RESPONSE DÖN - MESAJ DÖNDÜRME
    res.json({ 
      success: true,
      messageId: savedMessage._id,
      chatId: chat._id
    });
    
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ msg: 'Mesaj gönderilemedi', error: error.message });
  }
});

// ========================
// MARK AS READ
// ========================
router.put('/:chatId/read/:userId', async (req, res) => {
  try {
    const { chatId, userId } = req.params;
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ msg: 'Sohbet bulunamadı' });
    }
    
    // Mark messages as read
    chat.messages.forEach(message => {
      if (message.sender.toString() !== userId.toString() && !message.isDeleted) {
        message.read = true;
        if (message.status !== 'read') {
          message.status = 'read';
          message.statusDetails.readAt = new Date();
          
          const alreadyRead = message.statusDetails.readBy.some(
            readEntry => readEntry.user.toString() === userId.toString()
          );
          
          if (!alreadyRead) {
            message.statusDetails.readBy.push({
              user: userId,
              readAt: new Date()
            });
          }
        }
      }
    });
    
    // Reset unread count
    chat.unreadCount.set(userId.toString(), 0);
    await chat.save();
    
    // Emit read status
    const io = req.app.get('io');
    if (io) {
      chat.participants.forEach(participantId => {
        if (participantId.toString() !== userId.toString()) {
          const roomName = `user_${participantId}`;
          io.to(roomName).emit('messages_read', {
            chatId: chat._id,
            userId: userId,
            readAt: new Date()
          });
        }
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ msg: 'Güncelleme başarısız', error: error.message });
  }
});

// ========================
// DELETE MESSAGE
// ========================
router.delete('/:chatId/message/:messageId', async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const { userId } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ msg: 'Sohbet bulunamadı' });
    }

    const messageIndex = chat.messages.findIndex(msg => 
      msg._id && msg._id.toString() === messageId
    );

    if (messageIndex === -1) {
      return res.status(404).json({ msg: 'Mesaj bulunamadı' });
    }

    const message = chat.messages[messageIndex];
    
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ msg: 'Bu mesajı silme yetkiniz yok' });
    }

    // Mark as deleted
    chat.messages[messageIndex].isDeleted = true;
    chat.messages[messageIndex].deletedAt = new Date();
    chat.messages[messageIndex].deletedBy = userId;
    await chat.save();

    // Emit delete event
    const io = req.app.get('io');
    if (io) {
      chat.participants.forEach(participantId => {
        const roomName = `user_${participantId._id}`;
        io.to(roomName).emit('message_deleted', {
          chatId: chat._id,
          messageId: messageId
        });
      });
    }

    res.json({ success: true, messageId });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ msg: 'Mesaj silinemedi', error: error.message });
  }
});

module.exports = router;

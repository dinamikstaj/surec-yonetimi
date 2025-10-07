const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const Chat = require('../models/Chat');
const User = require('../models/User');

// Multer konfigürasyonu - dosya yükleme için
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
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Sadece resim ve belirli dosya türlerine izin ver
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

// Dosya yükleme endpoint'i
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'Dosya seçilmedi' });
    }

    const fileUrl = `/uploads/chat/${req.file.filename}`;
    
    res.json({
      success: true,
      fileUrl: fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype
    });
  } catch (error) {
    console.error('Dosya yükleme hatası:', error);
    res.status(500).json({ msg: 'Dosya yüklenemedi', error: error.message });
  }
});

// Update user status message
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

// Get all chats for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const chats = await Chat.find({ participants: userId })
      .populate('participants', 'name email avatar role')
      .sort({ lastMessageTime: -1 });
    
    res.json(chats);
  } catch (error) {
    console.error('Chats fetch error:', error);
    res.status(500).json({ msg: 'Sohbetler getirilemedi', error: error.message });
  }
});

// Get or create chat between two users
router.post('/get-or-create', async (req, res) => {
  try {
    const { userId1, userId2 } = req.body;
    
    if (!userId1 || !userId2) {
      return res.status(400).json({ msg: 'İki kullanıcı ID gerekli' });
    }
    
    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [userId1, userId2] }
    }).populate('participants', 'name email avatar role');
    
    // Create new chat if doesn't exist
    if (!chat) {
      chat = new Chat({
        participants: [userId1, userId2],
        messages: [],
        unreadCount: new Map([[userId1, 0], [userId2, 0]])
      });
      await chat.save();
      await chat.populate('participants', 'name email avatar role');
    }
    
    // Filter out deleted messages
    chat.messages = chat.messages.filter(msg => !msg.isDeleted);
    
    res.json(chat);
  } catch (error) {
    console.error('Get or create chat error:', error);
    res.status(500).json({ msg: 'Sohbet oluşturulamadı', error: error.message });
  }
});

// Send message
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
    
    // Add message
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
    
    chat.messages.push(newMessage);
    chat.lastMessage = content;
    chat.lastMessageTime = new Date();
    
    // Update unread count for other participants
    chat.participants.forEach(participantId => {
      if (participantId.toString() !== senderId.toString()) {
        const currentCount = chat.unreadCount.get(participantId.toString()) || 0;
        chat.unreadCount.set(participantId.toString(), currentCount + 1);
      }
    });
    
    await chat.save();
    await chat.populate('participants', 'name email avatar role');
    await chat.populate('messages.sender', 'name email avatar');
    
    // Filter out deleted messages
    chat.messages = chat.messages.filter(msg => !msg.isDeleted);
    
    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      const populatedMessage = {
        ...newMessage,
        sender: chat.participants.find(p => p._id.toString() === senderId.toString())
      };
      
      console.log('Emitting message to participants:', chat.participants.map(p => p._id.toString()));
      console.log('Chat ID:', chat._id);
      console.log('Message content:', populatedMessage.content);
      console.log('Sender ID:', senderId);
      
      const messageData = {
        chatId: chat._id,
        message: populatedMessage
      };
      
      // Send to ALL participants (including sender) - but only via room, not direct socket
      chat.participants.forEach(participantId => {
        const roomName = `user_${participantId._id}`;
        console.log(`Sending message to room: ${roomName}`);
        console.log('Message data being sent:', JSON.stringify(messageData, null, 2));
        
        // Emit to the room only - remove direct socket emit to prevent duplicates
        io.to(roomName).emit('new_message', messageData);
      });
    }
    
    res.json(chat);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ msg: 'Mesaj gönderilemedi', error: error.message });
  }
});

// Mark messages as read
router.put('/:chatId/read/:userId', async (req, res) => {
  try {
    const { chatId, userId } = req.params;
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ msg: 'Sohbet bulunamadı' });
    }
    
    // Mark all messages as read for this user
    chat.messages.forEach(message => {
      if (message.sender.toString() !== userId.toString()) {
        message.read = true;
        
        // Update message status to read
        if (message.status !== 'read') {
          message.status = 'read';
          message.statusDetails.readAt = new Date();
          
          // Add user to readBy array if not already there
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
    
    // Emit read status update to other participants
    const io = req.app.get('io');
    if (io) {
      const readData = {
        chatId: chat._id,
        userId: userId,
        readAt: new Date()
      };
      
      chat.participants.forEach(participantId => {
        if (participantId.toString() !== userId.toString()) {
          const roomName = `user_${participantId}`;
          io.to(roomName).emit('messages_read', readData);
        }
      });
    }
    
    res.json({ msg: 'Mesajlar okundu olarak işaretlendi' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ msg: 'Güncelleme başarısız', error: error.message });
  }
});

// Delete a message
router.delete('/:chatId/message/:messageId', async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const { userId } = req.body;

    console.log('Delete message request:', { chatId, messageId, userId });

    const chat = await Chat.findById(chatId);
    if (!chat) {
      console.log('Chat not found:', chatId);
      return res.status(404).json({ msg: 'Sohbet bulunamadı' });
    }

    console.log('Chat found, messages count:', chat.messages.length);
    console.log('Looking for message ID:', messageId);

    // Find the message - try both string and ObjectId comparison
    const messageIndex = chat.messages.findIndex(msg => {
      const msgId = msg._id ? msg._id.toString() : '';
      console.log('Comparing message ID:', msgId, 'with:', messageId);
      return msgId === messageId;
    });

    console.log('Message index found:', messageIndex);

    if (messageIndex === -1) {
      console.log('Message not found in chat');
      return res.status(404).json({ msg: 'Mesaj bulunamadı' });
    }

    const message = chat.messages[messageIndex];
    console.log('Message found:', message);
    
    // Check if user is the sender of the message
    const messageSenderId = message.sender ? message.sender.toString() : '';
    const requestUserId = userId ? userId.toString() : '';
    
    console.log('Message sender ID:', messageSenderId);
    console.log('Request user ID:', requestUserId);
    
    if (messageSenderId !== requestUserId) {
      console.log('User not authorized to delete this message');
      return res.status(403).json({ msg: 'Bu mesajı silme yetkiniz yok' });
    }

    // Mark message as deleted instead of removing it
    chat.messages[messageIndex].isDeleted = true;
    chat.messages[messageIndex].deletedAt = new Date();
    chat.messages[messageIndex].deletedBy = userId;
    await chat.save();

    console.log('Message marked as deleted successfully');

    // Emit socket event to notify all participants
    const io = req.app.get('io');
    if (io) {
      const messageData = {
        chatId: chat._id,
        messageId: messageId,
        action: 'delete'
      };
      
      console.log('Emitting message_deleted event:', messageData);
      
      chat.participants.forEach(participantId => {
        const roomName = `user_${participantId._id}`;
        console.log(`Sending delete notification to room: ${roomName}`);
        io.to(roomName).emit('message_deleted', messageData);
      });
    }

    res.json({ msg: 'Mesaj silindi', messageId });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ msg: 'Mesaj silinemedi', error: error.message });
  }
});

// Update user online status
router.put('/user/:userId/online', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isOnline } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        isOnline: isOnline,
        lastSeen: new Date(),
        lastLogin: new Date()
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ msg: 'Kullanıcı bulunamadı' });
    }
    
    // Emit online status change to all users
    const io = req.app.get('io');
    if (io) {
      io.emit('user_status_changed', {
        userId: user._id,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen
      });
    }
    
    res.json({
      success: true,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen
    });
  } catch (error) {
    console.error('Update online status error:', error);
    res.status(500).json({ msg: 'Durum güncellenemedi', error: error.message });
  }
});

// Get all users (Discord style - all users shown, online status indicated)
router.get('/all-users', async (req, res) => {
  try {
    const { excludeUserId } = req.query;
    
    const query = excludeUserId ? { _id: { $ne: excludeUserId } } : {};
    
    const users = await User.find(query)
      .select('name email avatar role lastLogin lastSeen isOnline statusMessage')
      .sort({ lastLogin: -1 });
    
    // Add online status based on lastLogin (within last 5 minutes = online)
    const usersWithStatus = users.map(user => ({
      ...user.toObject(),
      isOnline: user.isOnline || (user.lastLogin && (new Date() - new Date(user.lastLogin)) < 5 * 60 * 1000)
    }));
    
    res.json(usersWithStatus);
  } catch (error) {
    console.error('All users fetch error:', error);
    res.status(500).json({ msg: 'Kullanıcılar getirilemedi', error: error.message });
  }
});

module.exports = router;


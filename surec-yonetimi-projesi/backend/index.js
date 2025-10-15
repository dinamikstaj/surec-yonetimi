// backend/index.js

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config(); 

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Tüm origin'lere izin ver
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: false // credentials'ı false yap
  },
  transports: ['websocket', 'polling']
});

app.use(express.json());

// Ek CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(cors({
  origin: "*", // Tüm origin'lere izin ver
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: false // credentials'ı false yap
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io'yu app'e bağla (taskRoutes.js'de kullanılacak)
app.set('io', io);

// Socket.io connection handling - GERÇEK ONLINE DURUMU
const connectedUsers = new Map(); // userId -> Set of socket IDs (çoklu sekme için)
app.set('connectedUsers', connectedUsers);

const User = require('./models/User');

io.on('connection', (socket) => {
  console.log('✅ Socket connected:', socket.id);
  
  // Join user to their personal room
  socket.on('join_user', async (userId) => {
    try {
      socket.userId = userId;
      socket.join(`user_${userId}`);
      
      // Kullanıcının socket setini güncelle
      if (!connectedUsers.has(userId)) {
        connectedUsers.set(userId, new Set());
      }
      connectedUsers.get(userId).add(socket.id);
      
      // Database'de isOnline = true yap
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date(),
        lastLogin: new Date()
      });
      
      console.log(`👤 User ${userId} online - Socket: ${socket.id}`);
      console.log(`📊 Total online users: ${connectedUsers.size}`);
      
      // Tüm kullanıcılara bildir
      io.emit('user_status_changed', {
        userId: userId,
        isOnline: true,
        lastSeen: new Date()
      });
      
      socket.emit('joined_room', { room: `user_${userId}` });
    } catch (error) {
      console.error('Join user error:', error);
    }
  });
  
  // Typing events
  socket.on('typing_start', (data) => {
    socket.to(`user_${data.recipientId}`).emit('typing_start', data);
  });
  
  socket.on('typing_stop', (data) => {
    socket.to(`user_${data.recipientId}`).emit('typing_stop', data);
  });
  
  // Handle disconnect - OFFLINE YAP
  socket.on('disconnect', async () => {
    console.log('❌ Socket disconnected:', socket.id);
    
    if (socket.userId) {
      const userId = socket.userId;
      
      // Socket setinden çıkar
      if (connectedUsers.has(userId)) {
        connectedUsers.get(userId).delete(socket.id);
        
        // Eğer kullanıcının hiç socket'i kalmadıysa OFFLINE yap
        if (connectedUsers.get(userId).size === 0) {
          connectedUsers.delete(userId);
          
          try {
            // Database'de isOnline = false yap
            await User.findByIdAndUpdate(userId, {
              isOnline: false,
              lastSeen: new Date()
            });
            
            console.log(`👤 User ${userId} OFFLINE`);
            
            // Tüm kullanıcılara bildir
            io.emit('user_status_changed', {
              userId: userId,
              isOnline: false,
              lastSeen: new Date()
            });
          } catch (error) {
            console.error('Disconnect update error:', error);
          }
        }
      }
      
      console.log(`📊 Remaining online users: ${connectedUsers.size}`);
    }
  });
  
  // Heartbeat - Her 30 saniyede bir
  socket.on('heartbeat', async (userId) => {
    try {
      await User.findByIdAndUpdate(userId, {
        lastSeen: new Date()
      });
    } catch (error) {
      console.error('Heartbeat error:', error);
    }
  });
  
  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/usersRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/processes', require('./routes/processRoutes'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/license', require('./routes/licenseRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/communications', require('./routes/communicationRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/issues', require('./routes/issueRoutes'));
app.use('/api/service-jobs', require('./routes/serviceJobRoutes'));
app.use('/api/technicians', require('./routes/technicianRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));
app.use('/api/maintenance', require('./routes/maintenanceRoutes'));
app.use('/api/maintenance-contracts', require('./routes/maintenanceContractRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

// SMS Test Route
app.post('/api/sms/test', async (req, res) => {
  const { phone, message } = req.body;
  
  console.log('📱 SMS Test endpoint çağrıldı');
  console.log('📞 Phone:', phone);
  console.log('📝 Message:', message);
  console.log('⚙️ SMS_PROVIDER:', process.env.SMS_PROVIDER);
  console.log('🔑 SMS_API_ID:', process.env.SMS_API_ID ? 'Var' : 'Yok');
  
  try {
    const { sendSMS } = require('./services/smsService');
    console.log('✅ smsService yüklendi');
    
    const result = await sendSMS(phone, message || 'Test SMS - Dinamik Otomasyon');
    console.log('📤 SMS sonucu:', result);
    
    if (result.success) {
      res.json({ success: true, message: 'SMS başarıyla gönderildi', result });
    } else {
      res.json({ success: false, message: 'SMS gönderilemedi', error: result.error, result });
    }
  } catch (error) {
    console.error('❌ SMS endpoint hatası:', error);
    res.status(500).json({ success: false, message: 'SMS hatası', error: error.message, stack: error.stack });
  }
});

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/servis-takip-projesi', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB veritabanına başarıyla bağlanıldı.');
  
  // Server restart olduğunda tüm kullanıcıları offline yap
  try {
    const result = await User.updateMany(
      { isOnline: true },
      { isOnline: false, lastSeen: new Date() }
    );
    console.log(`🔄 Server restart - ${result.modifiedCount} kullanıcı offline yapıldı`);
  } catch (error) {
    console.error('Offline update error:', error);
  }
})
.catch((err) => {
  console.error('MongoDB bağlantı hatası:', err);
  process.exit(1);
});

// Models
const Task = require('./models/Task');
const Process = require('./models/Process');
const Customer = require('./models/Customer');
const Communication = require('./models/Communication');
const Settings = require('./models/Settings');

console.log('Models yüklendi - User:', !!User, 'Task:', !!Task, 'Process:', !!Process, 'Customer:', !!Customer, 'Communication:', !!Communication, 'Settings:', !!Settings);

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend sunucusu http://0.0.0.0:${PORT} adresinde çalışıyor.`);
  console.log(`Yerel erişim: http://localhost:${PORT}`);
  console.log(`Ağ erişimi: http://[SUNUCU_IP]:${PORT}`);
});
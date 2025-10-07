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
    origin: [
      "http://localhost:3000", 
      "http://127.0.0.1:3000",
      /^http:\/\/192\.168\.\d+\.\d+:3000$/,
      /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:3000$/
    ],
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

app.use(express.json());
app.use(cors({
  origin: [/^http:\/\/localhost:3000$/, /^http:\/\/192\.168\.1\.\d+:3000$/],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io'yu app'e bağla (taskRoutes.js'de kullanılacak)
app.set('io', io);

// Socket.io connection handling
const connectedUsers = new Map(); // Kullanıcı ID'lerini socket ID'leriyle eşleştir

// connectedUsers Map'ini app'e bağla
app.set('connectedUsers', connectedUsers);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join user to their personal room
  socket.on('join_user', (userId) => {
    // Önceki bağlantıyı temizle
    if (connectedUsers.has(userId)) {
      const oldSocketId = connectedUsers.get(userId);
      const oldSocket = io.sockets.sockets.get(oldSocketId);
      if (oldSocket) {
        oldSocket.leave(`user_${userId}`);
      }
    }
    
    // Yeni bağlantıyı kaydet
    connectedUsers.set(userId, socket.id);
    socket.userId = userId;
    socket.join(`user_${userId}`);
    
    console.log(`User ${userId} joined room: user_${userId} with socket ${socket.id}`);
    console.log('Connected users:', Array.from(connectedUsers.keys()));
    
    // Send confirmation
    socket.emit('joined_room', { room: `user_${userId}` });
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Kullanıcıyı bağlı kullanıcılar listesinden çıkar
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log(`User ${socket.userId} removed from connected users`);
      console.log('Remaining connected users:', Array.from(connectedUsers.keys()));
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
.then(() => {
  console.log('MongoDB veritabanına başarıyla bağlanıldı.');
})
.catch((err) => {
  console.error('MongoDB bağlantı hatası:', err);
  process.exit(1);
});

// Models
const User = require('./models/User');
const Task = require('./models/Task');
const Process = require('./models/Process');
const Customer = require('./models/Customer');
const Communication = require('./models/Communication');
const Settings = require('./models/Settings');

console.log('Models yüklendi - User:', !!User, 'Task:', !!Task, 'Process:', !!Process, 'Customer:', !!Customer, 'Communication:', !!Communication, 'Settings:', !!Settings);

// Socket.io bağlantıları
io.on('connection', (socket) => {
  console.log('Kullanıcı bağlandı:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Kullanıcı ayrıldı:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Backend sunucusu http://localhost:${PORT} adresinde çalışıyor.`);
});
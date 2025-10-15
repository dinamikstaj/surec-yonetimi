# Süreç Yönetimi Sistemi

Modern bir süreç yönetimi ve mesajlaşma sistemi. WhatsApp benzeri chat özellikleri ile donatılmıştır.

## 🚀 Özellikler

### 💬 WhatsApp Benzeri Chat Sistemi
- ✅ Gerçek zamanlı mesajlaşma (Socket.io)
- ✅ Mesaj durumları (Gönderildi, İletildi, Okundu)
- ✅ Son görülme zamanı
- ✅ Online/Offline durum göstergeleri
- ✅ Dosya ve resim paylaşımı
- ✅ Mesaj silme
- ✅ Typing göstergesi
- ✅ Tarih ayırıcıları
- ✅ Durum mesajları

### 🏢 İş Yönetimi
- Kullanıcı yönetimi
- Görev takibi
- Müşteri yönetimi
- Teknik destek sistemi
- Bakım sözleşmeleri
- Raporlama

## 🛠️ Teknolojiler

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Socket.io Client** - Real-time communication
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.io** - Real-time communication
- **Multer** - File uploads

## 📦 Kurulum

### Gereksinimler
- Node.js (v18 veya üzeri)
- MongoDB
- Git

### Adımlar

1. **Repository'yi klonlayın**
```bash
git clone https://github.com/KULLANICI_ADINIZ/surec-yonetimi.git
cd surec-yonetimi
```

2. **Backend bağımlılıklarını yükleyin**
```bash
cd surec-yonetimi-projesi/backend
npm install
```

3. **Frontend bağımlılıklarını yükleyin**
```bash
cd ../surec-yonetimi-frontend
npm install
```

4. **Environment dosyalarını oluşturun**
```bash
# Backend için
cp .env.example .env

# Frontend için
cp .env.example .env.local
```

5. **MongoDB'yi başlatın**
```bash
# MongoDB servisini başlatın
mongod
```

6. **Backend'i başlatın**
```bash
cd surec-yonetimi-projesi/backend
npm start
```

7. **Frontend'i başlatın**
```bash
cd surec-yonetimi-projesi/surec-yonetimi-frontend
npm run dev
```

## 🌐 Erişim

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 📱 Kullanım

### Admin Paneli
- `/admin/dashboard` - Ana dashboard
- `/admin/chat` - Mesajlaşma
- `/admin/users` - Kullanıcı yönetimi
- `/admin/customers` - Müşteri yönetimi

### Personel Paneli
- `/personnel/dashboard` - Personel dashboard
- `/personnel/chat` - Mesajlaşma
- `/personnel/tasks` - Görevler

## 🔧 Geliştirme

### Chat Sistemi Özellikleri
- Mesaj durumları: `sending`, `sent`, `delivered`, `read`
- Online durum takibi
- Son görülme zamanı
- Gerçek zamanlı bildirimler
- Dosya paylaşımı

### API Endpoints
- `POST /chat/:chatId/message` - Mesaj gönder
- `GET /chat/user/:userId` - Kullanıcı sohbetleri
- `PUT /chat/:chatId/read/:userId` - Mesajları okundu işaretle
- `PUT /chat/user/:userId/online` - Online durum güncelle

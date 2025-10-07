// backend/seed.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const mongoURI = 'mongodb://localhost:27017/surec-yonetimi';

// Kullanıcı şeması ve modeli seed dosyasında da tanımlanıyor
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['yonetici', 'teknik-servis-personeli', 'yazilim-personeli', 'müşteri'], default: 'müşteri' },
});
const User = mongoose.model('User', UserSchema);

const adminUser = {
    email: 'dinamikservice@admin.com',
    password: 'serviceadmin123',
    role: 'yonetici',
};

async function seedDatabase() {
    try {
        await mongoose.connect(mongoURI);
        const existingUser = await User.findOne({ email: adminUser.email });
        if (existingUser) {
            console.log('Admin kullanıcısı zaten mevcut.');
            mongoose.disconnect();
            return;
        }

        const hashedPassword = await bcrypt.hash(adminUser.password, 10);

        const newAdmin = new User({
            email: adminUser.email,
            password: hashedPassword,
            role: adminUser.role,
        });

        await newAdmin.save();
        console.log('Admin kullanıcısı başarıyla oluşturuldu.');
        mongoose.disconnect();
    } catch (error) {
        console.error('Veritabanı tohumlama işlemi başarısız oldu:', error);
        mongoose.disconnect();
    }
}

seedDatabase();
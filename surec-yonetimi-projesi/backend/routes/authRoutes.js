// backend/routes/authRoutes.js - Güncellenmiş
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// JWT_SECRET'ı direkt .env'den okumayı zorla.
const JWT_SECRET = process.env.JWT_SECRET;

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    console.log('Login denemesi:', { email, password: password ? '***' : 'yok' });

    if (!email || !password) {
        return res.status(400).json({ msg: 'Email ve şifre gereklidir' });
    }

    try {
        // Kullanıcıyı email ile bul
        const user = await User.findOne({ email });
        if (!user) {
            console.log('Kullanıcı bulunamadı:', email);
            return res.status(400).json({ msg: 'Geçersiz email veya şifre' });
        }

        console.log('Kullanıcı bulundu:', { id: user._id, email: user.email, role: user.role });
        console.log('Gelen şifre uzunluk:', password.length);
        console.log('DB\'deki hash uzunluk:', user.password.length);
        console.log('DB hash başlangıç:', user.password.substring(0, 10));

        // Şifre kontrolü
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Şifre karşılaştırma sonucu:', isMatch);
        
        // Test: Farklı şifreler deneyelim
        console.log('TEST: Gelen şifre tam:', JSON.stringify(password));
        
        if (!isMatch) {
            console.log('Şifre eşleşmiyor - Gelen:', password.substring(0, 3) + '***');
            console.log('Şifre eşleşmiyor - Hash:', user.password.substring(0, 15) + '***');
            
            // Manuel test: Bu kullanıcı için doğru şifreyi test et
            console.log('Manuel test yapılıyor...');
            const testPasswords = ['123456789', '123456', password.trim()];
            for (let testPass of testPasswords) {
                const testResult = await bcrypt.compare(testPass, user.password);
                console.log(`Test şifre "${testPass}":`, testResult);
                if (testResult) {
                    console.log('✅ DOĞRU ŞİFRE BULUNDU:', testPass);
                    break;
                }
            }
            
            return res.status(400).json({ msg: 'Geçersiz email veya şifre' });
        }

        console.log('Şifre doğru, token oluşturuluyor...');

        // JWT token oluştur
        const payload = { 
            user: { 
                id: user._id, 
                role: user.role,
                email: user.email 
            } 
        };

        const token = jwt.sign(payload, JWT_SECRET || 'defaultSecret', { expiresIn: '24h' });
        
        console.log('Login başarılı:', { userId: user._id, role: user.role });

        res.json({ 
            msg: 'Giriş başarılı!', 
            token, 
            role: user.role,
            userId: user._id.toString(),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Login hatası:', err.message);
        res.status(500).json({ msg: 'Sunucu hatası: ' + err.message });
    }
});

module.exports = router;
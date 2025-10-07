// backend/controllers/auth.controller.js
const STATIC_ADMIN = {
  username: 'dinamikservice@admin.com',
  password: 'dinamikservice123' // Bu satırı değiştirin
};

exports.loginController = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Kullanıcı adı ve şifre zorunludur.' });
  }

  // Admin hesabı kontrolü
  if (username === STATIC_ADMIN.username && password === STATIC_ADMIN.password) {
    return res.status(200).json({
      success: true,
      message: 'Giriş başarılı! Yönetici paneline yönlendiriliyorsunuz...',
      role: 'admin'
    });
  }

  return res.status(401).json({ success: false, message: 'Geçersiz kullanıcı adı veya şifre.' });
};
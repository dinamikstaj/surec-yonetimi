const nodemailer = require('nodemailer');

// Email transporter oluştur
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });
};

// Email gönder
const sendEmail = async (to, subject, content) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            ${subject}
          </h2>
          <div style="margin: 20px 0; line-height: 1.6;">
            ${content.replace(/\n/g, '<br>')}
          </div>
          <footer style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            <p>Bu email Süreç Yönetimi Sistemi tarafından otomatik olarak gönderilmiştir.</p>
          </footer>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email başarıyla gönderildi:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email gönderme hatası:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail
}; 
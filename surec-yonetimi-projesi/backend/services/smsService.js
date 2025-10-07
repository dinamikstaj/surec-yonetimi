const https = require('https');
const axios = require('axios');

// SMS gönder (Türkiye için popüler SMS API'leri)
const sendSMS = async (to, content) => {
  try {
    // Telefon numarasını temizle (sadece rakamlar)
    const cleanPhone = to.replace(/[^\d]/g, '');
    
    // Türkiye telefon numarası kontrolü
    if (!cleanPhone.startsWith('90') && cleanPhone.length === 10) {
      // 90 ülke kodu ekle
      to = '90' + cleanPhone;
    } else if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
      // 0'ı çıkar, 90 ekle
      to = '90' + cleanPhone.substring(1);
    } else {
      to = cleanPhone;
    }

    console.log('📱 SMS gönderiliyor:', to);

    // VATANSMS API (Kullanıcının tercih ettiği sağlayıcı)
    if (process.env.SMS_PROVIDER === 'vatansms') {
      return await sendVatanSMS(to, content);
    }

    // NETGSM API (Türkiye'nin en popüler SMS sağlayıcılarından)
    if (process.env.SMS_PROVIDER === 'netgsm') {
      return await sendNetGSM(to, content);
    }
    
    // İLETİMERKEZİ API (Türkiye'nin güvenilir SMS sağlayıcısı)
    if (process.env.SMS_PROVIDER === 'iletimerkezi') {
      return await sendIletiMerkezi(to, content);
    }

    // VERIMOR API (Alternatif SMS sağlayıcısı)
    if (process.env.SMS_PROVIDER === 'verimor') {
      return await sendVerimor(to, content);
    }

    // Varsayılan olarak VatanSMS kullan
    return await sendVatanSMS(to, content);

  } catch (error) {
    console.error('SMS gönderme hatası:', error);
    return { success: false, error: error.message };
  }
};

// VATANSMS API entegrasyonu
const sendVatanSMS = async (to, content) => {
  try {
    if (!process.env.SMS_API_URI) {
      console.log('⚠️ SMS API yapılandırılmamış, SMS gönderilmedi');
      return { success: false, error: 'SMS API yapılandırılmamış' };
    }

    const data = {
      api_id: process.env.SMS_API_ID,
      api_key: process.env.SMS_API_KEY,
      message_type: 'normal',
      message_content_type: 'bilgi',
      sender: process.env.SMS_SENDER,
      phones: [to],
      message: content
    };

    console.log('📱 VatanSMS API çağrılıyor:', process.env.SMS_API_URI);
    console.log('📞 Telefon:', to);

    const response = await axios.post(process.env.SMS_API_URI, data, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    console.log('✅ VatanSMS yanıt:', response.data);

    if (response.data.status === 'success') {
      return { 
        success: true, 
        messageId: response.data.message_id || 'sent', 
        provider: 'vatansms', 
        result: response.data 
      };
    } else {
      return { 
        success: false, 
        error: response.data.message || 'VatanSMS Error', 
        result: response.data 
      };
    }
  } catch (error) {
    console.error('❌ VatanSMS hatası:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      return { success: false, error: error.response.data.message || error.message };
    }
    return { success: false, error: error.message };
  }
};

// NETGSM API entegrasyonu
const sendNetGSM = async (to, content) => {
  return new Promise((resolve, reject) => {
    const postData = `usercode=${process.env.NETGSM_USER}&password=${process.env.NETGSM_PASS}&gsmno=${to}&message=${encodeURIComponent(content)}&msgheader=${process.env.NETGSM_HEADER || 'DEMO'}`;
    
    const options = {
      hostname: 'api.netgsm.com.tr',
      port: 443,
      path: '/sms/send/get',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (data.startsWith('00') || data.startsWith('01') || data.startsWith('02')) {
          resolve({ success: true, messageId: data, provider: 'netgsm' });
        } else {
          resolve({ success: false, error: 'NetGSM Error: ' + data });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ success: false, error: e.message });
    });

    req.write(postData);
    req.end();
  });
};

// İLETİMERKEZİ API entegrasyonu
const sendIletiMerkezi = async (to, content) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      request: {
        authentication: {
          key: process.env.ILETIMERKEZI_KEY,
          hash: process.env.ILETIMERKEZI_HASH
        },
        order: {
          sender: process.env.ILETIMERKEZI_SENDER || 'DEMO',
          sendDateTime: [],
          iys: 1,
          iysList: 'BIREYSEL',
          message: {
            text: content,
            receipents: {
              number: [to]
            }
          }
        }
      }
    });

    const options = {
      hostname: 'api.iletimerkezi.com',
      port: 443,
      path: '/v1/send-sms/json',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.response && response.response.status && response.response.status.code === 200) {
            resolve({ success: true, messageId: response.response.jobId, provider: 'iletimerkezi' });
          } else {
            resolve({ success: false, error: 'İletiMerkezi Error: ' + data });
          }
        } catch (e) {
          resolve({ success: false, error: 'Parse error: ' + e.message });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ success: false, error: e.message });
    });

    req.write(postData);
    req.end();
  });
};

// VERIMOR API entegrasyonu
const sendVerimor = async (to, content) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      username: process.env.VERIMOR_USER,
      password: process.env.VERIMOR_PASS,
      source_addr: process.env.VERIMOR_SENDER || 'DEMO',
      messages: [
        {
          msg: content,
          dest: to
        }
      ]
    });

    const options = {
      hostname: 'sms.verimor.com.tr',
      port: 443,
      path: '/v2/send.json',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.status === 0) {
            resolve({ success: true, messageId: response.message_id, provider: 'verimor' });
          } else {
            resolve({ success: false, error: 'Verimor Error: ' + response.message });
          }
        } catch (e) {
          resolve({ success: false, error: 'Parse error: ' + e.message });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ success: false, error: e.message });
    });

    req.write(postData);
    req.end();
  });
};

module.exports = {
  sendSMS
}; 
# SMS Kurulum Talimatları

## Desteklenen SMS Sağlayıcıları

### 1. NetGSM (Önerilen)
- Web sitesi: https://www.netgsm.com.tr/
- API Dokümantasyonu: https://www.netgsm.com.tr/dokuman/
- Türkiye'nin en yaygın SMS sağlayıcılarından biri

**Kurulum:**
```env
SMS_PROVIDER=netgsm
NETGSM_USER=your-username
NETGSM_PASS=your-password
NETGSM_HEADER=YOUR-SENDER-NAME
```

### 2. İletimM
erkezi
- Web sitesi: https://www.iletimerkezi.com/
- API Dokümantasyonu: https://www.iletimerkezi.com/api-dokumantasyonu
- Güvenilir ve hızlı SMS servisi

**Kurulum:**
```env
SMS_PROVIDER=iletimerkezi
ILETIMERKEZI_KEY=your-api-key
ILETIMERKEZI_HASH=your-hash-key
ILETIMERKEZI_SENDER=YOUR-SENDER-NAME
```

### 3. Verimor
- Web sitesi: https://www.verimor.com.tr/
- API Dokümantasyonu: https://sms.verimor.com.tr/api-documentation
- Ekonomik SMS çözümleri

**Kurulum:**
```env
SMS_PROVIDER=verimor
VERIMOR_USER=your-username
VERIMOR_PASS=your-password
VERIMOR_SENDER=YOUR-SENDER-NAME
```

## Kurulum Adımları

1. **SMS Sağlayıcısı Seçin**: Yukarıdaki sağlayıcılardan birini seçin ve hesap oluşturun
2. **API Bilgilerini Alın**: Seçtiğiniz sağlayıcıdan API anahtarlarınızı alın
3. **Environment Variables**: .env dosyasına API bilgilerinizi ekleyin
4. **Test Edin**: Müşteri iletişim sayfasından SMS göndererek test edin

## Test

Sistem çalıştıktan sonra:
1. Admin panelinde müşteriler sayfasına gidin
2. Bir müşteri seçin ve "İletişim" butonuna tıklayın
3. SMS seçeneğini işaretleyin
4. Mesajınızı yazın ve gönderin
5. Console'da SMS gönderim loglarını kontrol edin

## Hata Giderme

- **SMS gönderilmiyor**: API bilgilerinizi kontrol edin
- **Geçersiz telefon numarası**: Türkiye formatında olduğundan emin olun (5XXXXXXXXX)
- **API hatası**: Sağlayıcınızın dokümantasyonunu kontrol edin

## Not

- SMS gönderimi gerçek para harcar, test yapmadan önce sağlayıcınızın fiyatlarını kontrol edin
- Telefon numaraları otomatik olarak Türkiye formatına (90XXXXXXXXXX) çevrilir
- Her SMS gönderiminin logu Communication tablosunda saklanır 
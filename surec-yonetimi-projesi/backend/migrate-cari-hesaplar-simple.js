const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MongoDB bağlantısı
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/servis-takip-projesi', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB bağlantısı başarılı');
  } catch (error) {
    console.error('❌ MongoDB bağlantı hatası:', error);
    process.exit(1);
  }
};

// Basit Customer modeli (unique constraint'ler olmadan)
const customerSchema = new mongoose.Schema({
  // SQL'den gelen temel alanlar
  cariKod: { type: String, trim: true },
  cariUnvan1: { type: String, trim: true },
  cariUnvan2: { type: String, trim: true },
  cariGuid: { type: String },
  
  // İletişim bilgileri
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  website: { type: String, trim: true },
  
  // Adres bilgileri
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  district: { type: String, trim: true },
  
  // Vergi bilgileri
  vkn: { type: String, trim: true },
  taxOffice: { type: String, trim: true },
  
  // EFT bilgileri
  eftAccountNumber: { type: String, trim: true },
  
  // Durum bilgileri
  isActive: { type: Boolean, default: true },
  isLocked: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  
  // E-fatura bilgileri
  eInvoiceEnabled: { type: Boolean, default: false },
  eInvoiceStartDate: { type: String, trim: true }, // String olarak tut
  
  // Bildirim tercihleri
  smsNotification: { type: Boolean, default: false },
  emailNotification: { type: Boolean, default: false },
  reconciliationEmail: { type: String, trim: true },
  
  // Tarih bilgileri
  createDate: { type: String, trim: true }, // String olarak tut
  lastUpdateDate: { type: String, trim: true }, // String olarak tut
  
  // Kullanıcı bilgileri
  createUser: { type: Number },
  lastUpdateUser: { type: Number },
  
  // MongoDB'ye özel alanlar
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Customer = mongoose.model('Customer', customerSchema);

// SQL değerini temizleyen fonksiyon
function cleanValue(value) {
  if (!value || value === 'NULL') return null;
  
  // Tırnak işaretlerini kaldır
  value = value.replace(/^['"]|['"]$/g, '');
  
  // Boş string kontrolü
  if (value === '' || value === 'NULL') return null;
  
  return value;
}

// Boolean dönüştürme fonksiyonu
function parseBoolean(value) {
  if (!value || value === 'NULL') return false;
  const cleanVal = cleanValue(value);
  return cleanVal === '1' || cleanVal === 'true' || cleanVal === 'True';
}

// Number dönüştürme fonksiyonu
function parseNumber(value) {
  if (!value || value === 'NULL') return null;
  const cleanVal = cleanValue(value);
  const num = parseFloat(cleanVal);
  return isNaN(num) ? null : num;
}

// SQL INSERT satırlarını parse eden fonksiyon
function parseSQLInsert(sqlLine) {
  try {
    // INSERT INTO [CARI_HESAPLAR] kısmını atla
    const valuesMatch = sqlLine.match(/VALUES\s*\((.*)\)\s*$/i);
    if (!valuesMatch) return null;
    
    const valuesString = valuesMatch[1];
    
    // Değerleri parse et (basit yaklaşım)
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    let quoteChar = '';
    let parenCount = 0;
    
    for (let i = 0; i < valuesString.length; i++) {
      const char = valuesString[i];
      
      if (!inQuotes && (char === "'" || char === '"')) {
        inQuotes = true;
        quoteChar = char;
        currentValue += char;
      } else if (inQuotes && char === quoteChar) {
        // Escape karakteri kontrolü
        if (i + 1 < valuesString.length && valuesString[i + 1] === quoteChar) {
          currentValue += char + char;
          i++; // Bir sonraki karakteri atla
        } else {
          inQuotes = false;
          quoteChar = '';
          currentValue += char;
        }
      } else if (!inQuotes && char === '(') {
        parenCount++;
        currentValue += char;
      } else if (!inQuotes && char === ')') {
        parenCount--;
        currentValue += char;
      } else if (!inQuotes && char === ',' && parenCount === 0) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Son değeri ekle
    if (currentValue.trim()) {
      values.push(currentValue.trim());
    }
    
    return values;
  } catch (error) {
    console.error('SQL parse hatası:', error);
    return null;
  }
}

// SQL verilerini MongoDB'ye dönüştüren ana fonksiyon
async function migrateCariHesaplar() {
  try {
    console.log('🚀 Cari Hesaplar migration başlatılıyor...');
    
    // SQL dosyasını oku
    const sqlFilePath = path.join(__dirname, '..', 'hesaplar.txt');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // INSERT satırlarını bul
    const insertLines = sqlContent.split('\n').filter(line => 
      line.trim().startsWith('INSERT INTO [CARI_HESAPLAR]')
    );
    
    console.log(`📊 ${insertLines.length} adet cari hesap bulundu`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Her INSERT satırını işle
    for (let i = 0; i < insertLines.length; i++) {
      try {
        const values = parseSQLInsert(insertLines[i]);
        if (!values || values.length < 50) {
          console.log(`⚠️  Satır ${i + 1}: Yetersiz veri (${values ? values.length : 0} alan)`);
          errorCount++;
          continue;
        }
        
        // SQL alanlarını MongoDB alanlarına map et (basitleştirilmiş)
        const customerData = {
          // Temel bilgiler
          cariKod: cleanValue(values[13]), // cari_kod
          cariUnvan1: cleanValue(values[14]), // cari_unvan1
          cariUnvan2: cleanValue(values[15]), // cari_unvan2
          cariGuid: cleanValue(values[0]), // cari_Guid
          
          // İletişim bilgileri (yaklaşık pozisyonlar)
          email: cleanValue(values[values.length - 20]), // cari_EMail
          phone: cleanValue(values[values.length - 19]), // cari_CepTel
          website: cleanValue(values[values.length - 21]), // cari_wwwadresi
          
          // Adres bilgileri
          address: cleanValue(values[31]), // cari_fatura_adres_no
          city: cleanValue(values[34]), // cari_bolge_kodu
          district: cleanValue(values[35]), // cari_grup_kodu
          
          // Vergi bilgileri
          vkn: cleanValue(values[26]), // cari_vdaire_no
          taxOffice: cleanValue(values[25]), // cari_vdaire_adi
          
          // EFT bilgileri
          eftAccountNumber: cleanValue(values[33]), // cari_EftHesapNum
          
          // Durum bilgileri
          isActive: parseBoolean(values[36]), // cari_firma_acik_kapal
          isLocked: parseBoolean(values[38]), // cari_cari_kilitli_flg
          isDeleted: parseBoolean(values[3]), // cari_iptal
          
          // E-fatura bilgileri
          eInvoiceEnabled: parseBoolean(values[40]), // cari_efatura_fl
          eInvoiceStartDate: cleanValue(values[values.length - 15]), // cari_efatura_baslangic_tarihi
          
          // Bildirim tercihleri
          smsNotification: parseBoolean(values[values.length - 6]), // cari_gonderionayi_sms
          emailNotification: parseBoolean(values[values.length - 5]), // cari_gonderionayi_email
          reconciliationEmail: cleanValue(values[values.length - 14]), // cari_mutabakat_mail_adresi
          
          // Tarih bilgileri
          createDate: cleanValue(values[10]), // cari_create_date
          lastUpdateDate: cleanValue(values[12]), // cari_lastup_date
          
          // Kullanıcı bilgileri
          createUser: parseNumber(values[9]), // cari_create_user
          lastUpdateUser: parseNumber(values[11]), // cari_lastup_user
          
          // MongoDB'ye özel alanlar
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Boş değerleri temizle
        Object.keys(customerData).forEach(key => {
          if (customerData[key] === null || customerData[key] === undefined || customerData[key] === '') {
            delete customerData[key];
          }
        });
        
        // MongoDB'ye kaydet
        const customer = new Customer(customerData);
        await customer.save();
        
        successCount++;
        
        if (successCount % 100 === 0) {
          console.log(`✅ ${successCount} kayıt işlendi...`);
        }
        
      } catch (error) {
        console.error(`❌ Satır ${i + 1} hatası:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n🎉 Migration tamamlandı!');
    console.log(`✅ Başarılı: ${successCount}`);
    console.log(`❌ Hatalı: ${errorCount}`);
    console.log(`📊 Toplam: ${insertLines.length}`);
    
  } catch (error) {
    console.error('❌ Migration hatası:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
  }
}

// Script çalıştırma
if (require.main === module) {
  connectDB().then(() => {
    migrateCariHesaplar();
  });
}

module.exports = { migrateCariHesaplar, connectDB };

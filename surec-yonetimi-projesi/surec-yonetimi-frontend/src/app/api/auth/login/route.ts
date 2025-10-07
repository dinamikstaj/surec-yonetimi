import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    const { email, password, loginType } = await req.json();

    console.log('Login isteği:', { email, loginType });

    if (!email || !password || !loginType) {
      return NextResponse.json({ msg: 'Email, parola ve login tipi gerekli' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ email });

    if (!user) {
      console.log('Kullanıcı bulunamadı:', email);
      return NextResponse.json({ msg: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    console.log('Kullanıcı bulundu:', { email: user.email, role: user.role });

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      console.log('Parola hatalı');
      return NextResponse.json({ msg: 'Parola hatalı' }, { status: 401 });
    }

    console.log('Parola doğru, role kontrolü:', { loginType, userRole: user.role });

    // Login tipi kontrolü - role mapping düzeltmesi
    if (loginType === 'admin' && user.role !== 'yonetici') {
      console.log('Admin login denemesi ama kullanıcı yönetici değil:', user.role);
      return NextResponse.json({ msg: 'Sadece yönetici hesabı ile giriş yapabilirsiniz' }, { status: 403 });
    }

    if (loginType === 'personnel' && user.role !== 'kullanici') {
      console.log('Personnel login denemesi ama kullanıcı personel değil:', user.role);
      return NextResponse.json({ msg: 'Sadece personel hesabı ile giriş yapabilirsiniz' }, { status: 403 });
    }

    const token = jwt.sign(
      { _id: user._id.toString(), role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    console.log('Login başarılı, token oluşturuldu');

    return NextResponse.json({ 
      token, 
      role: user.role, 
      userId: user._id.toString(),
      message: 'Giriş başarılı!'
    }, { status: 200 });

  } catch (error) {
    console.error('Login hatası:', error);
    return NextResponse.json({ msg: 'Giriş yapılamadı' }, { status: 500 });
  }
}

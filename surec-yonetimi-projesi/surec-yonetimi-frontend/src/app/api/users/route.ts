import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// --- Kullanıcı Tipi ---
type UserType = {
  _id?: any;
  name: string;
  email: string;
  password?: string;
  phone: string;
  role: string;
  imageUrl?: string | null;
};

// --- GET: Tüm kullanıcıları getir ---
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const users = await db.collection('users').find({}).toArray();

    const sanitizedUsers = users.map((u: UserType) => ({
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      imageUrl: u.imageUrl || null,
    }));

    return NextResponse.json(sanitizedUsers, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Kullanıcılar getirilemedi' }, { status: 500 });
  }
}

// --- POST: Yeni kullanıcı ekle ---
export async function POST(req: NextRequest) {
  try {
    const body: UserType = await req.json();
    const { name, email, password, phone, role } = body;

    if (!name || !email || !password || !phone || !role) {
      return NextResponse.json({ error: 'Tüm alanlar zorunludur' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.collection('users').insertOne({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      imageUrl: null,
    });

    return NextResponse.json(
      { _id: result.insertedId.toString(), name, email, phone, role },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Kullanıcı eklenemedi' }, { status: 500 });
  }
}

// --- PUT: Kullanıcıyı güncelle ---
export async function PUT(req: NextRequest) {
  try {
    const body: UserType & { _id: string } = await req.json();
    const { _id, name, email, password, phone, role } = body;

    if (!_id || !name || !email || !phone || !role) {
      return NextResponse.json({ error: 'Tüm alanlar (şifre hariç) zorunludur' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const updateData: Partial<UserType> = { name, email, phone, role };

    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(_id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({ _id, ...updateData, message: 'Kullanıcı güncellendi' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Kullanıcı güncellenemedi' }, { status: 500 });
  }
}

// --- DELETE: Kullanıcıyı sil ---
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      const body = await req.json().catch(() => ({}));
      if (body._id) id = body._id;
    }

    if (!id) {
      return NextResponse.json({ error: '_id gerekli' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const result = await db.collection('users').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Kullanıcı silindi' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Kullanıcı silinemedi' }, { status: 500 });
  }
}

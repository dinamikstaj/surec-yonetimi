import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// --- DELETE: Kullanıcıyı dinamik id ile sil ---
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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

// --- PUT: Kullanıcıyı dinamik id ile güncelle ---
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { name, email, password, phone, role } = body;

    if (!id || !name || !email || !phone || !role) {
      return NextResponse.json({ error: 'Tüm alanlar (şifre hariç) zorunludur' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const updateData: any = { name, email, phone, role };
    if (password && password.trim() !== '') {
      updateData.password = password;
    }

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({ _id: id, ...updateData, message: 'Kullanıcı güncellendi' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Kullanıcı güncellenemedi' }, { status: 500 });
  }
}

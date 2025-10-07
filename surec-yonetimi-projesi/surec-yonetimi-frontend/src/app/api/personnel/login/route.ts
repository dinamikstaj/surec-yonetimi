import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "gizliAnahtar";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email ve şifre gerekli" }, { status: 400 });
  }

  const { db } = await connectToDatabase();
  const user = await db.collection("users").findOne({ email });

  if (!user) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return NextResponse.json({ error: "Şifre hatalı" }, { status: 401 });
  }

  const token = jwt.sign({ user: { id: user._id } }, JWT_SECRET, { expiresIn: "1h" });

  return NextResponse.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}

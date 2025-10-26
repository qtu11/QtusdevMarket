import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: 'Vui lòng điền đầy đủ thông tin' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự' }, { status: 400 });
    }

    // Simple validation for email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Email không hợp lệ' }, { status: 400 });
    }

    // Get all users from localStorage (server-side stores in memory)
    const allUsers: any[] = [];

    // Check if email already exists (for demo only - should check database in production)
    // In production, check against MySQL database using getUserByEmail from lib/database
    if (allUsers.some((u: any) => u.email === email)) {
      return NextResponse.json({ success: false, error: 'Email đã được sử dụng' }, { status: 400 });
    }

    const newUser = {
      uid: Date.now().toString(),
      email: email,
      displayName: name,
      name: name,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      provider: "email",
      balance: 0,
      status: "active",
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      loginCount: 1,
      ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
      password: password, // Store password for demo (in production, use bcrypt)
    };

    // Save user (Note: In production, save to MySQL database using createUser from lib/database)
    allUsers.push(newUser);
    console.log('New user registered:', email);
    console.log('⚠️ WARNING: User not saved to database. This is a demo registration.');

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    console.error('API Register Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to register user' }, { status: 500 });
  }
}

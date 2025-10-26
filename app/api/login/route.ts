import { NextRequest, NextResponse } from 'next/server'
import bcryptjs from 'bcryptjs'
import { signInWithEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, deviceInfo, ipAddress } = await request.json()

    // Simple admin check
    if (email === 'admin@qtusdev.com' && password === 'admin123') {
      return NextResponse.json({
        success: true,
        user: {
          id: 'admin',
          email: 'admin@qtusdev.com',
          name: 'Admin',
          role: 'admin'
        }
      })
    }

    // For regular users, use the signInWithEmail function from lib/auth.ts
    const result = await signInWithEmail(email, password, {
      deviceInfo,
      ipAddress,
      rememberMe: false, // Assuming rememberMe is not handled here, or default to false
    });

    if (result.error) {
      return NextResponse.json({ success: false, error: result.error }, { status: 401 });
    }

    return NextResponse.json({ success: true, user: result.user }, { status: 200 });

  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

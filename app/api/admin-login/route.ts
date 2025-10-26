import { NextRequest, NextResponse } from 'next/server'
import bcryptjs from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password, deviceInfo, ipAddress } = await request.json()

    // Admin credentials check
    if (email === 'admin@qtusdev.com' && password === 'admin123') {
      return NextResponse.json({
        success: true,
        user: {
          id: 'admin',
          email: 'admin@qtusdev.com',
          name: 'Admin',
          role: 'admin',
          loginTime: new Date().toISOString(),
          deviceInfo,
          ipAddress
        }
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Thông tin đăng nhập không chính xác!'
    }, { status: 401 })

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json({
      success: false,
      error: 'Lỗi hệ thống!'
    }, { status: 500 })
  }
}
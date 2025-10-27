import { NextRequest, NextResponse } from 'next/server'
import bcryptjs from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password, deviceInfo, ipAddress } = await request.json()

    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || ''
    const adminPassword = process.env.ADMIN_PASSWORD || ''
    
    // Admin credentials check
    if (email === adminEmail && password === adminPassword) {
      return NextResponse.json({
        success: true,
        user: {
          id: 'admin',
          email: adminEmail,
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

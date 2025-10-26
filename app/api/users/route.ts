import { NextRequest, NextResponse } from "next/server"
import { getUserData, saveUserData, onUsersChange } from "@/lib/mysql"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (userId) {
      const users = getUserData()
      const user = users.find((u: any) => u.uid === userId)
      return NextResponse.json({ data: user, error: null })
    } else {
      // Return all users
      const users = getUserData()
      return NextResponse.json({ data: users, error: null })
    }
  } catch (error: any) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userData } = body
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }
    
    const users = getUserData()
    const userIndex = users.findIndex((u: any) => u.uid === userId)
    if (userIndex >= 0) {
      users[userIndex] = { ...users[userIndex], ...userData }
      saveUserData(users)
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
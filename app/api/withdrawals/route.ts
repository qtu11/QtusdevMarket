import { NextRequest, NextResponse } from 'next/server';
import { getWithdrawals, createWithdrawal } from '@/lib/database';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    const withdrawals = await getWithdrawals(userId ? parseInt(userId) : undefined);
    
    return NextResponse.json({
      success: true,
      withdrawals
    });
  } catch (error) {
    console.error('Withdrawals API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();

    // Create withdrawal
    const result = await createWithdrawal({
      userId: body.userId,
      amount: body.amount,
      bankName: body.bankName,
      accountNumber: body.accountNumber,
      accountName: body.accountName
    });

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request received',
      withdrawalId: result.id
    });
  } catch (error) {
    console.error('Withdrawal POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
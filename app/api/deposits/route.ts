import { NextRequest, NextResponse } from 'next/server';
import { getDeposits, createDeposit, updateDepositStatus } from '@/lib/database';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    const deposits = await getDeposits(userId ? parseInt(userId) : undefined);
    
    return NextResponse.json({
      success: true,
      deposits
    });
  } catch (error) {
    console.error('Deposits API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();
    
    // Create deposit
    const result = await createDeposit({
      userId: body.userId,
      amount: body.amount,
      method: body.method,
      transactionId: body.transactionId
    });
    
    return NextResponse.json({
      success: true,
      message: 'Deposit request received',
      depositId: result.id
    });
  } catch (error) {
    console.error('Deposit POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();
    
    // Update deposit status
    await updateDepositStatus(
      body.depositId,
      body.status,
      body.approvedBy
    );
    
    return NextResponse.json({
      success: true,
      message: 'Deposit status updated'
    });
  } catch (error) {
    console.error('Deposit PUT error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
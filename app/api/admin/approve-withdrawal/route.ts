import { NextRequest, NextResponse } from 'next/server';
import { updateWithdrawalStatus, updateUserBalance, getUserById } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { withdrawalId, amount, userId, action } = await request.json();

    if (!withdrawalId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: withdrawalId or userId' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // Check if user has sufficient balance
      const user = await getUserById(parseInt(userId));
      if (user && user.balance < amount) {
        return NextResponse.json(
          { error: 'Insufficient balance' },
          { status: 400 }
        );
      }

      // Update user balance - deduct amount
      if (user) {
        const newBalance = user.balance - amount;
        await updateUserBalance(parseInt(userId), newBalance);
      }

      // Update withdrawal status
      await updateWithdrawalStatus(parseInt(withdrawalId), 'approved');
    } else if (action === 'reject') {
      // Update withdrawal status to rejected
      await updateWithdrawalStatus(parseInt(withdrawalId), 'rejected');
    }

    // Send notification
    if (action === 'approve') {
      const message = `✅ <b>RÚT TIỀN ĐÃ ĐƯỢC DUYỆT</b>

💰 Số tiền rút: ${amount.toLocaleString('vi-VN')}đ
📝 Withdrawal ID: ${withdrawalId}
⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}

<i>Tiền đã được trừ khỏi tài khoản người dùng.</i>`;

      if (process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN && process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID) {
        try {
          await fetch(`https://api.telegram.org/bot${process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID,
              text: message,
              parse_mode: 'HTML'
            })
          });
        } catch (error) {
          console.error('Telegram notification failed:', error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'Withdrawal approved successfully' : 'Withdrawal rejected',
      withdrawalId,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error processing withdrawal approval:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

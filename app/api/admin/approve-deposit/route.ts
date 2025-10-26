import { NextRequest, NextResponse } from 'next/server';
import { updateDepositStatus, updateUserBalance, getDeposits, getUserById } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { depositId, amount, userId, action } = await request.json();

    if (!depositId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: depositId or userId' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // Update deposit status
      await updateDepositStatus(parseInt(depositId), 'approved');

      // Update user balance - add amount
      const user = await getUserById(parseInt(userId));
      if (user) {
        const newBalance = (user.balance || 0) + amount;
        await updateUserBalance(parseInt(userId), newBalance);
      }
    } else if (action === 'reject') {
      // Update deposit status to rejected
      await updateDepositStatus(parseInt(depositId), 'rejected');
    }

    // Send notification
    if (action === 'approve') {
      const message = `✅ <b>NẠP TIỀN ĐÃ ĐƯỢC DUYỆT</b>

💰 Số tiền: ${amount.toLocaleString('vi-VN')}đ
📝 Deposit ID: ${depositId}
⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}

<i>Tiền đã được cộng vào tài khoản người dùng.</i>`;

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
      message: action === 'approve' ? 'Deposit approved successfully' : 'Deposit rejected',
      depositId,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error processing deposit approval:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

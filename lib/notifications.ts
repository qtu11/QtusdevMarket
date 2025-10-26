export const sendDepositNotification = async (depositInfo: any) => {
  try {
    if (!process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || !process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID) {
      console.warn('Telegram credentials not configured')
      return false
    }

    const message = `💳 <b>YÊU CẦU NẠP TIỀN MỚI</b>

👤 <b>Khách hàng:</b> ${depositInfo.userName}
📧 <b>Email:</b> ${depositInfo.userEmail}
💰 <b>Số tiền:</b> ${depositInfo.amount.toLocaleString('vi-VN')}đ
🏦 <b>Phương thức:</b> ${depositInfo.method}
📝 <b>Mã GD:</b> ${depositInfo.transactionId}
⏰ <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}

<i>Vui lòng kiểm tra và duyệt yêu cầu!</i>`

    const response = await fetch(`https://api.telegram.org/bot${process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Deposit notification error:', error)
    return false
  }
}

export const sendWithdrawalNotification = async (withdrawalInfo: any) => {
  try {
    if (!process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || !process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID) {
      console.warn('Telegram credentials not configured')
      return false
    }

    const message = `💸 <b>YÊU CẦU RÚT TIỀN MỚI</b>

👤 <b>Khách hàng:</b> ${withdrawalInfo.userName}
📧 <b>Email:</b> ${withdrawalInfo.userEmail}
💰 <b>Số tiền:</b> ${withdrawalInfo.amount.toLocaleString('vi-VN')}đ
🏦 <b>Phương thức:</b> ${withdrawalInfo.method}
📝 <b>Thông tin:</b> ${withdrawalInfo.accountName} - ${withdrawalInfo.accountNumber}
⏰ <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}

<i>Vui lòng kiểm tra và xử lý!</i>`

    const response = await fetch(`https://api.telegram.org/bot${process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Withdrawal notification error:', error)
    return false
  }
}

// Additional functions needed by the application
export const getDeviceInfo = () => {
  if (typeof window === 'undefined') {
    return {
      deviceType: 'Unknown',
      browser: 'Unknown',
      os: 'Unknown',
      userAgent: 'Unknown'
    };
  }

  const userAgent = navigator.userAgent;
  let deviceType = 'Desktop';
  let browser = 'Unknown';
  let os = 'Unknown';

  // Detect device type
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    deviceType = 'Mobile';
  } else if (/iPad/i.test(userAgent)) {
    deviceType = 'Tablet';
  }

  // Detect browser
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';

  // Detect OS
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';

  return {
    deviceType,
    browser,
    os,
    userAgent
  };
};

export const getIPAddress = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'Unknown';
  } catch (error) {
    console.error('Error getting IP address:', error);
    return 'Unknown';
  }
};
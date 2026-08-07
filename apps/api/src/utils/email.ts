// สำหรับส่งอีเมล (ตัวอย่างง่ายๆ)
export const sendEmail = async (to: string, subject: string, html: string) => {
  // TODO: Implement with Nodemailer or any email service
  console.log(`📧 Sending email to ${to}`)
  console.log(`Subject: ${subject}`)
  console.log(`HTML: ${html}`)
  
  // For demo: Log instead of actually sending
  return { success: true, messageId: 'demo-' + Date.now() }
}

export const generateResetPasswordHTML = (resetLink: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .button { display: inline-block; padding: 12px 24px; background: #4fc3f7; color: #000; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 20px; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>🔐 Reset Your Password</h2>
        <p>คุณได้ขอรีเซ็ตรหัสผ่านสำหรับบัญชี IQTF Platform</p>
        <p>คลิกปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่:</p>
        <a href="${resetLink}" class="button">Reset Password</a>
        <p>ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง</p>
        <p>ถ้าคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาละเว้นอีเมลนี้</p>
        <div class="footer">© 2026 IQTF Platform</div>
      </div>
    </body>
    </html>
  `
}

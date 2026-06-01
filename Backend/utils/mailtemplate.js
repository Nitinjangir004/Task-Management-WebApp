// otp template 

// A reusable function to generate the HTML email
export const generateOtpEmailTemplate = (otp,signup) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; border-radius: 10px; background-color: #ffffff;">
      
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f0f0f5;">
        <h2 style="color: #1a1a1a; margin: 0; font-size: 24px;">Flowship</h2>
      </div>
      
      <div style="padding: 30px 0; color: #4a4a4a; line-height: 1.6; font-size: 16px;">
        <p style="margin-top: 0;">Hello,</p>
        ${signup ? `<p>Thank you for signing up! To complete your registration and secure your account, please use the following One-Time Password (OTP) to verify your email address.</p>
        ` : `<p>We received a request to reset your password. Please use the following One-Time Password (OTP) to securely authorize this change.</p>`}
        
        <div style="text-align: center; margin: 35px 0;">
          <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4F46E5; background-color: #EEF2FF; padding: 15px 30px; border-radius: 8px; border: 1px solid #C7D2FE;">
            ${otp}
          </span>
        </div>
        
        <p>This code is valid for <strong>10 minutes</strong>.</p>
        <p style="font-size: 14px; color: #71717a;">If you did not request this email, there is nothing you need to do. Simply ignore this message.</p>
      </div>
      
      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #f0f0f5; color: #a1a1aa; font-size: 12px;">
        <p style="margin: 0;">This is an automated message, please do not reply to this email.</p>
        <p style="margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} Task Management App. All rights reserved.</p>
      </div>
      
    </div>
  `;
};

// welcome mail template
export const generateWelcomeEmailTemplate = (username) => {
    return `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; 
    margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; 
    border-radius: 10px; background-color: #ffffff;">
      
      <div style="text-align: center; padding-bottom: 20px; 
      border-bottom: 2px solid #f0f0f5;">
        <h2 style="color: #1a1a1a; margin: 0;">Flowship</h2>
      </div>

      <div style="padding: 30px 0; color: #4a4a4a; 
      line-height: 1.6; font-size: 16px;">
        <p>Hey <strong>${username}</strong></p>
        <p>Welcome to <strong>Flowship</strong> — where teams sync and ship before the deadline.</p>
        <p>Your account is verified and ready to go.</p>

        <div style="text-align: center; margin: 35px 0;">
          <a href="${process.env.CLIENT_URL}/dashboard" 
          style="background-color: #4F46E5; color: white; 
          padding: 12px 30px; border-radius: 8px; 
          text-decoration: none; font-weight: bold; font-size: 16px;">
            Go to Dashboard →
          </a>
        </div>

        <p style="font-size: 14px; color: #71717a;">
          Need help? Reply to this email or reach us at 
          <a href="mailto:contact@nitinjangir.dev">contact@nitinjangir.dev</a>
        </p>
      </div>

      <div style="text-align: center; padding-top: 20px; 
      border-top: 1px solid #f0f0f5; color: #a1a1aa; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Flowship. All rights reserved.</p>
      </div>

    </div>
    `
}
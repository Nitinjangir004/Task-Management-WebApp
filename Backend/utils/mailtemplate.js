// otp template 

// A reusable function to generate the HTML email
export const generateOtpEmailTemplate = (otp, signup) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Flowship Verification</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7fb;font-family:'Segoe UI',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;padding:30px 15px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
            <!-- Header -->
            <tr>
              <td align="center" style="padding:30px 20px;border-bottom:1px solid #e5e7eb;">
                <h1 style="margin:0;color:#111827;font-size:28px;">
                  Flowship
                </h1>
                <p style="margin-top:8px;color:#6b7280;font-size:14px;">
                  Team Collaboration & Task Management
                </p>
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="padding:40px 35px;color:#374151;line-height:1.7;">
                <p>Hello,</p>${signup? `
                  <p>
                    Thank you for creating your Flowship account.
                    To complete your registration and verify your email address,
                    please enter the verification code below.
                  </p>`: 
                  `<p>
                    We received a request to reset the password associated
                    with your Flowship account.
                    Use the verification code below to continue.
                  </p>`}
                  <div style="text-align:center;margin:35px 0;">
                  <div style="
                    display:inline-block;
                    background:#eef2ff;
                    border:1px solid #c7d2fe;
                    color:#4338ca;
                    padding:18px 35px;
                    border-radius:10px;
                    font-size:34px;
                    font-weight:bold;
                    letter-spacing:8px;
                  ">${otp}
                  </div>
                </div>
                <p>
                  This verification code is valid for
                  <strong>10 minutes</strong>.
                </p>
                <p>
                  For your security, never share this code with anyone.
                  Flowship support will never ask for your verification code.
                </p>
                <p style="color:#6b7280;font-size:14px;">
                  If you did not request this email, you can safely ignore it.
                  No changes will be made to your account.
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="
                padding:25px;
                text-align:center;
                border-top:1px solid #e5e7eb;
                color:#6b7280;
                font-size:12px;
              ">
                <p style="margin:5px 0;">
                  Flowship – Team Collaboration & Task Management
                </p>
                <p style="margin:5px 0;">
                  Contact:
                  <a href="mailto:contact@nitinjangir.dev">
                    contact@nitinjangir.dev
                  </a>
                </p>
                <p style="margin:5px 0;">
                  Website:
                  <a href="${process.env.CLIENT_URL}">
                    ${process.env.CLIENT_URL}
                  </a>
                </p>
                <p style="margin-top:10px;">
                  © ${new Date().getFullYear()} Flowship. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;};

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
          <a href="${process.env.CLIENT_URL}dashboard" 
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
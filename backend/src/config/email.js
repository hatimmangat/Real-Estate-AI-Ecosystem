import { Resend } from 'resend';

let resendClient = null;

const initializeResend = () => {
  if (resendClient) {
    return resendClient;
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn('❌ Resend API key not configured.');
    return null;
  }

  try {
    resendClient = new Resend(process.env.RESEND_API_KEY);
    console.log('✅ Resend initialized successfully');
    return resendClient;
  } catch (error) {
    console.error('❌ Failed to initialize Resend:', error);
    return null;
  }
};

const getVerificationEmailHTML = (userName, code) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0a5a7d, #094667); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .code-box { background: white; border: 2px dashed #094667; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
    .code { font-size: 32px; font-weight: bold; color: #094667; letter-spacing: 8px; font-family: monospace; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    .logo { font-size: 48px; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🏠</div>
      <h1 style="margin: 0;">Estate Pro</h1>
      <p style="margin: 10px 0 0 0;">Email Verification</p>
    </div>
    <div class="content">
      <h2>Hello ${userName}!</h2>
      <p>Thank you for signing up with Estate Pro. To complete your registration, please verify your email address using the code below.</p>
      
      <div class="code-box">
        <p style="margin: 0 0 10px 0; color: #666;">Your verification code is:</p>
        <div class="code">${code}</div>
      </div>
      
      <p>This code will expire in <strong>1 hour</strong>.</p>
      
      <p style="color: #666; font-size: 14px;">If you didn't create an account with Estate Pro, please ignore this email.</p>
      
      <p style="margin-top: 30px;">Best regards,<br><strong>The Estate Pro Team</strong></p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Estate Pro. All rights reserved.</p>
      <p>This is an automated email, please do not reply.</p>
    </div>
  </div>
</body>
</html>
`;

const getPasswordResetEmailHTML = (userName, resetUrl) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0a5a7d, #094667); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 15px 30px; background: #094667; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    .logo { font-size: 48px; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"> 
      <div class="logo">🏠</div>
      <h1 style="margin: 0;">Estate Pro</h1>
      <p style="margin: 10px 0 0 0;">Password Reset Request</p>
    </div>
    <div class="content"> 
      <h2>Hello ${userName}!</h2>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button" style="color: white !important;">Reset Password</a>
      </div>
      
      <p>Or copy and paste this link in your browser:<br><a href="${resetUrl}" style="color: #094667; word-break: break-all;">${resetUrl}</a></p>
      
      <p>This link will expire in <strong>1 hour</strong>.</p>
      
      <p style="color: #666; font-size: 14px;">If you didn't request a password reset, please ignore this email.</p>
      
      <p style="margin-top: 30px;">Best regards,<br><strong>The Estate Pro Team</strong></p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Estate Pro. All rights reserved.</p>
      <p>This is an automated email, please do not reply.</p>
    </div>
  </div>
</body>
</html>
`;

export const sendVerificationEmail = async (email, code, userName) => {
  console.log('📧 Attempting to send verification email via Resend...');

  const resend = initializeResend();

  if (!resend) {
    console.log('\n=================================');
    console.log('📧 RESEND NOT CONFIGURED');
    console.log('=================================');
    console.log(`Verification code for ${email}: ${code}`);
    console.log('=================================\n');
    return true;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: [email],
      subject: 'Verify Your Email - Estate Pro',
      html: getVerificationEmailHTML(userName, code),
      text: `Hello ${userName}! Your Estate Pro verification code is: ${code}. This code will expire in 1 hour.`
    });

    if (error) {
      throw error;
    }

    console.log(`✅ Email sent to ${email}`);
    console.log('Resend Message ID:', data.id);
    return true;
  } catch (error) {
    console.error('❌ Resend error:', error.message);
    console.log('\n=================================');
    console.log('📧 EMAIL SEND FAILED - SHOWING CODE');
    console.log('=================================');
    console.log(`Verification code for ${email}: ${code}`);
    console.log('=================================\n');
    return true;
  }
};

export const sendPasswordResetEmail = async (email, resetUrl, userName) => {
  console.log('📧 Attempting to send password reset email via Resend...');

  const resend = initializeResend();

  if (!resend) {
    console.log('\n=================================');
    console.log('📧 RESEND NOT CONFIGURED');
    console.log('=================================');
    console.log(`Password reset link for ${email}:`);
    console.log(resetUrl);
    console.log('=================================\n');
    return true;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: [email],
      subject: 'Reset Your Password - Estate Pro',
      html: getPasswordResetEmailHTML(userName, resetUrl),
      text: `Hello ${userName}! Reset your Estate Pro password using this link: ${resetUrl}. This link will expire in 1 hour.`
    });

    if (error) {
      throw error;
    }

    console.log(`✅ Email sent to ${email}`);
    console.log('Resend Message ID:', data.id);
    return true;
  } catch (error) {
    console.error('❌ Resend error:', error.message);
    console.log('\n=================================');
    console.log('📧 EMAIL SEND FAILED - SHOWING LINK');
    console.log('=================================');
    console.log(`Password reset link for ${email}:`);
    console.log(resetUrl);
    console.log('=================================\n');
    return true;
  }
};

export default resendClient;

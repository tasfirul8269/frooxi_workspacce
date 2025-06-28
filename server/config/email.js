const nodemailer = require('nodemailer');

// Email configuration for Namecheap cPanel
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.yourdomain.com', // Your domain's mail server
    port: process.env.SMTP_PORT || 587, // Usually 587 for TLS or 465 for SSL
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || 'noreply@yourdomain.com', // Your email address
      pass: process.env.SMTP_PASS || 'your-email-password', // Your email password
    },
    tls: {
      rejectUnauthorized: false // Only if you have SSL certificate issues
    }
  });
};

// Send email function
const sendEmail = async (to, subject, body, htmlBody = null) => {
  try {
    console.log('📧 Creating email transporter...');
    console.log('📧 SMTP Config:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      user: process.env.SMTP_USER,
      from: process.env.SMTP_FROM
    });
    
    const transporter = createTransporter();
    
    // Create sender name and email
    const senderName = process.env.SMTP_SENDER_NAME || 'Frooxi Workspace';
    const senderEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@yourdomain.com';
    const fromAddress = `"${senderName}" <${senderEmail}>`;
    
    const mailOptions = {
      from: fromAddress,
      to: to,
      subject: subject,
      text: body,
      html: htmlBody || body.replace(/\n/g, '<br>'), // Convert line breaks to HTML
    };

    console.log('📧 Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('📧 Email sending failed:', error);
    throw error;
  }
};

module.exports = { sendEmail, createTransporter }; 
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

const sendPasswordResetEmail = async (toEmail, fullName, resetLink) => {
    await transporter.sendMail({
        from: `"Smart Street Lighting" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'Reset Your Password',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
                <h2 style="color: #111827;">Reset Your Password</h2>
                <p>Hi ${fullName},</p>
                <p>We received a request to reset your password for the Smart Street Lighting system. Click the button below to choose a new password. This link expires in 1 hour.</p>
                <p style="text-align: center; margin: 28px 0;">
                    <a href="${resetLink}"
                       style="background: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                        Reset Password
                    </a>
                </p>
                <p style="color: #6b7280; font-size: 13px;">
                    If you didn't request this, you can safely ignore this email — your password won't change.
                </p>
            </div>
        `
    });
};

module.exports = { sendPasswordResetEmail };
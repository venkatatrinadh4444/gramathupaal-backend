import * as nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS  // app password or SMTP password
  }
});

export const sendCredentials = (email: string, username: string, password: string) => {
  const options = {
    from: 'no-reply@gmail.com',
    to: email,
    subject: 'Your Account Credentials',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
        <h2 style="color: #333;">Welcome to Our Platform!</h2>
        <p style="font-size: 14px; color: #555;">
          Your account has been successfully created. Please find your login credentials below:
        </p>
        
        <div style="margin: 20px 0; padding: 15px; background: #fff; border: 1px dashed #888; border-radius: 6px;">
          <p style="margin: 0; font-size: 14px; color: #555;">
            <strong>Username:</strong> ${username}
          </p>
          <p style="margin: 5px 0 0; font-size: 14px; color: #555;">
            <strong>Password:</strong> ${password}
          </p>
        </div>

        <p style="font-size: 14px; color: #555;">
          For security reasons, please log in and change your password immediately.
        </p>

        <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
          If you did not request this account, please ignore this email.
        </p>
      </div>
    `,
  };

  transporter.sendMail(options, (error:any, info:any) => {
    if (error) {
      console.error('Error sending credentials email:', error);
    }
  });
};

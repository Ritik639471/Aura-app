import express from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from '../models/User.js';

const router = express.Router();

// Register New User
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user exists by email or username
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Create user
    const user = new User({ username, email, password });
    await user.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or username
    
    // Find user by either email or username
    const user = await User.findOne({ 
      $or: [{ username: identifier }, { email: identifier }] 
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, username: user.username }, 
      process.env.JWT_SECRET || 'supersecretkey_change_in_production',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, username: user.username }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Forgot Password - Generate OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'No user found with that email' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set OTP and expiration (15 minutes)
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    // Configure Nodemailer Transporter
    // If EMAIL_USER is not in .env, it defaults to a recognizable error mode
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: `Aura Workspace <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Aura - Password Reset Authentication Code',
        html: `
          <div style="font-family: Arial, sans-serif; text-align: center; padding: 40px; background-color: #f4f4f9;">
            <div style="background-color: white; padding: 40px; border-radius: 12px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              <h2 style="color: #6366F1; margin-bottom: 24px;">Password Reset Request</h2>
              <p style="color: #333; font-size: 16px;">We received a request to reset your Aura Workspace password.</p>
              <p style="color: #333; font-size: 16px; margin-bottom: 32px;">Enter the following 6-digit code to securely complete your reset:</p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b; margin-bottom: 32px;">
                ${otp}
              </div>

              <p style="color: #64748b; font-size: 14px;">If you did not request this, you can safely ignore this email.</p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`✉️ Email successfully sent to ${email}`);
      res.json({ message: 'Secure OTP sent to your email! Please check your inbox.' });
    } else {
      // Fallback if environment variables aren't set up yet
      console.log(`\n\n========================================`);
      console.log(`[NO EMAIL CONFIG] MOCK EMAIL SENT TO: ${email}`);
      console.log(`🔑 YOUR PASSWORD RESET OTP IS: ${otp}`);
      console.log(`========================================\n\n`);
      res.json({ message: 'OTP generated! (Check console - Setup Gmail API to send real emails)' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error generating OTP' });
  }
});

// Reset Password - Verify OTP and Update Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    const user = await User.findOne({ 
      email, 
      resetPasswordOtp: otp,
      resetPasswordExpires: { $gt: Date.now() } // Ensure OTP hasn't expired
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    
    // Update password and clear OTP fields
    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    res.json({ message: 'Password reset completely successful! Please log in.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during password reset' });
  }
});

export default router;

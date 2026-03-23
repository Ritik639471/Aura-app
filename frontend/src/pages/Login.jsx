import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, UserPlus, LogIn, KeyRound } from 'lucide-react';
import axios from 'axios';

const API_URL = 'https://aura-app-keg8.onrender.com/api';

const Login = () => {
  const [view, setView] = useState('login'); // 'login', 'register', 'forgot'
  
  // Form States
  const [identifier, setIdentifier] = useState(''); // Used for login (email or username)
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
  // UI States
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setIsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { identifier, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.user.username);
      localStorage.setItem('userId', res.data.user.id);
      navigate('/rooms');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    }
    setIsLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setIsLoading(true);
    try {
      await axios.post(`${API_URL}/auth/register`, { email, username, password });
      setView('login');
      setSuccess('Account created successfully! Please log in.');
      setIdentifier(username); // Pre-fill
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
    setIsLoading(false);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setIsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setSuccess(res.data.message);
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    }
    setIsLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setIsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/reset-password`, { email, otp, newPassword: password });
      setView('login');
      setSuccess(res.data.message);
      setIdentifier(email);
      setPassword('');
      setOtp('');
      setOtpSent(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Password reset failed');
    }
    setIsLoading(false);
  };

  const switchView = (newView) => {
    setView(newView);
    setError('');
    setSuccess('');
    setPassword('');
    setOtp('');
    setOtpSent(false);
  };

  return (
    <div className="login-wrapper" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        
        <div style={{ marginBottom: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '16px', 
            background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px var(--primary-glow)'
          }}>
            <MessageSquare color="white" size={32} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>
            {view === 'login' && 'Welcome Back'}
            {view === 'register' && 'Create Account'}
            {view === 'forgot' && 'Reset Password'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {view === 'login' && 'Sign in to continue to Aura'}
            {view === 'register' && 'Get started with Aura'}
            {view === 'forgot' && 'Enter your email to reset your password'}
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.875rem' }}>
            {success}
          </div>
        )}

        {view === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Email or Username</label>
              <input className="input-base" type="text" placeholder="e.g. johndoe or user@email.com" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Password</label>
                <span onClick={() => switchView('forgot')} style={{ fontSize: '0.75rem', color: 'var(--primary-accent)', cursor: 'pointer' }}>Forgot?</span>
              </div>
              <input className="input-base" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary" style={{ marginTop: '10px' }}>
              {isLoading ? 'Loading...' : <><LogIn size={18} /> Sign In</>}
            </button>
            <p style={{ marginTop: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Don't have an account? <span onClick={() => switchView('register')} style={{ color: 'var(--primary-accent)', cursor: 'pointer', fontWeight: '600' }}>Sign up</span>
            </p>
          </form>
        )}

        {view === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Email</label>
              <input className="input-base" type="email" placeholder="hello@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Username</label>
              <input className="input-base" type="text" placeholder="e.g. johndoe" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Password</label>
              <input className="input-base" type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary" style={{ marginTop: '10px' }}>
              {isLoading ? 'Creating...' : <><UserPlus size={18} /> Sign Up</>}
            </button>
            <p style={{ marginTop: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Already have an account? <span onClick={() => switchView('login')} style={{ color: 'var(--primary-accent)', cursor: 'pointer', fontWeight: '600' }}>Log in</span>
            </p>
          </form>
        )}

        {view === 'forgot' && (
          <form onSubmit={otpSent ? handleResetPassword : handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Account Email</label>
              <input className="input-base" type="email" placeholder="Enter your registered email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={otpSent} />
            </div>
            
            {otpSent && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>6-Digit OTP</label>
                  <input className="input-base" type="text" placeholder="Check your console for the OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '1.25rem' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>New Password</label>
                  <input className="input-base" type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
              </>
            )}

            <button type="submit" disabled={isLoading} className="btn-primary" style={{ marginTop: '10px' }}>
              {isLoading ? 'Processing...' : (
                otpSent ? <><KeyRound size={18} /> Resets Password</> : <><MessageSquare size={18} /> Send OTP</>
              )}
            </button>
            <p style={{ marginTop: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Remember your password? <span onClick={() => switchView('login')} style={{ color: 'var(--primary-accent)', cursor: 'pointer', fontWeight: '600' }}>Back to login</span>
            </p>
          </form>
        )}

      </div>
    </div>
  );
};

export default Login;

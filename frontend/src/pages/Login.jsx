import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, UserPlus, LogIn, KeyRound } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';

const Login = () => {
  const [view, setView] = useState('login');
  
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
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
      setIdentifier(username);
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
    <div className="w-full h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-600/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="glass-panel p-10 w-full max-w-md text-center relative z-10">
        
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-[0_8px_32px_rgba(99,102,241,0.5)]">
            <MessageSquare className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {view === 'login' && 'Welcome Back'}
            {view === 'register' && 'Create Account'}
            {view === 'forgot' && 'Reset Password'}
          </h1>
          <p className="text-slate-400 text-sm font-medium">
            {view === 'login' && 'Sign in to continue to Aura'}
            {view === 'register' && 'Get started with Aura'}
            {view === 'forgot' && 'Enter your email to reset your password'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-sm font-medium">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl mb-6 text-sm font-medium">
            {success}
          </div>
        )}

        {view === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-5 text-left">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-300">Email or Username</label>
              <input className="input-base" type="text" placeholder="e.g. johndoe or user@email.com" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-300">Password</label>
                <span onClick={() => switchView('forgot')} className="text-xs text-brand-400 hover:text-brand-300 cursor-pointer font-medium transition-colors">Forgot?</span>
              </div>
              <input className="input-base" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary mt-2">
              {isLoading ? 'Loading...' : <><LogIn size={20} /> Sign In</>}
            </button>
            <p className="mt-4 text-center text-sm font-medium text-slate-400">
              Don't have an account? <span onClick={() => switchView('register')} className="text-brand-400 hover:text-brand-300 cursor-pointer font-semibold transition-colors">Sign up</span>
            </p>
          </form>
        )}

        {view === 'register' && (
          <form onSubmit={handleRegister} className="flex flex-col gap-5 text-left">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-300">Email</label>
              <input className="input-base" type="email" placeholder="hello@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-300">Username</label>
              <input className="input-base" type="text" placeholder="e.g. johndoe" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-300">Password</label>
              <input className="input-base" type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary mt-2">
              {isLoading ? 'Creating...' : <><UserPlus size={20} /> Sign Up</>}
            </button>
            <p className="mt-4 text-center text-sm font-medium text-slate-400">
              Already have an account? <span onClick={() => switchView('login')} className="text-brand-400 hover:text-brand-300 cursor-pointer font-semibold transition-colors">Log in</span>
            </p>
          </form>
        )}

        {view === 'forgot' && (
          <form onSubmit={otpSent ? handleResetPassword : handleSendOtp} className="flex flex-col gap-5 text-left">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-300">Account Email</label>
              <input className="input-base" type="email" placeholder="Enter your registered email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={otpSent} />
            </div>
            
            {otpSent && (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-300">6-Digit OTP</label>
                  <input className="input-base tracking-[0.5em] text-center text-lg font-bold" type="text" placeholder="XXXXXX" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-300">New Password</label>
                  <input className="input-base" type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
              </>
            )}

            <button type="submit" disabled={isLoading} className="btn-primary mt-2">
              {isLoading ? 'Processing...' : (
                otpSent ? <><KeyRound size={20} /> Reset Password</> : <><MessageSquare size={20} /> Send OTP</>
              )}
            </button>
            <p className="mt-4 text-center text-sm font-medium text-slate-400">
              Remember your password? <span onClick={() => switchView('login')} className="text-brand-400 hover:text-brand-300 cursor-pointer font-semibold transition-colors">Back to login</span>
            </p>
          </form>
        )}

      </div>
    </div>
  );
};

export default Login;

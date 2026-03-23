import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Save } from 'lucide-react';
import axios from 'axios';

const API_URL = 'https://aura-app-keg8.onrender.com/api';

const Profile = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const [profile, setProfile] = useState({ bio: '', status: '', avatar: null });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    axios.get(`${API_URL}/profile/${username}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setProfile(r.data))
      .catch(() => {});
  }, [username, token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('bio', profile.bio);
      fd.append('status', profile.status);
      if (file) fd.append('avatar', file);
      const res = await axios.put(`${API_URL}/profile`, fd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      setProfile(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const avatarSrc = preview || profile.avatar;

  return (
    <div className="login-wrapper" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '460px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: 'var(--glass-border)', paddingBottom: '20px' }}>
          <button onClick={() => navigate('/rooms')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><ArrowLeft size={20} /></button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>My Profile</h1>
        </div>

        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', fontWeight: '700', overflow: 'hidden', border: '3px solid var(--primary-accent)' }}>
              {avatarSrc ? <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : username?.[0]?.toUpperCase()}
            </div>
            <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '26px', height: '26px', background: 'var(--primary-accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={13} color="white" />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setPreview(URL.createObjectURL(f)); } }} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>@{username}</h2>
        </div>

        {/* Status */}
        <div>
          <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Status</label>
          <input className="input-base" value={profile.status || ''} onChange={e => setProfile(p => ({ ...p, status: e.target.value }))} placeholder="👋 Hey there!" maxLength={80} />
        </div>

        {/* Bio */}
        <div>
          <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Bio</label>
          <textarea className="input-base" value={profile.bio || ''} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} placeholder="Tell people about yourself..." maxLength={160} rows={3} style={{ resize: 'none', fontFamily: 'inherit' }} />
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textAlign: 'right', marginTop: '4px' }}>{(profile.bio || '').length}/160</p>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Save size={16} /> {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
};

export default Profile;

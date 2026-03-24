import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Chat from './pages/Chat';
import Rooms from './pages/Rooms';
import Profile from './pages/Profile';
import Layout from './components/Layout';
import './index.css';

// Wrapper to conditionally apply Layout
const AppLayout = ({ children }) => {
  const location = useLocation();
  const noLayoutPaths = ['/login'];
  
  if (noLayoutPaths.includes(location.pathname)) {
    return <>{children}</>;
  }
  
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/chat/:roomName" element={<Chat />} />
          <Route path="/chat" element={<Navigate to="/rooms" replace />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;

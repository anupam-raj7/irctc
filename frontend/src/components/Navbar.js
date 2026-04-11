import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Train, LogOut, User, Ticket, Menu, X, Download } from 'lucide-react';
import api from '../utils/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const downloadLogs = async () => {
    try {
      const res = await api.get('/auth/download-logs', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url;
      a.download = 'irctc_accounts.txt'; a.click();
    } catch { alert('Download failed'); }
  };

  return (
    <nav style={{
      background: 'rgba(8,8,18,0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      position: 'sticky', top: 0, zIndex: 100,
      padding: '0 24px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            background: 'linear-gradient(135deg, #FF9933, #ea580c)',
            borderRadius: 10, padding: '7px 10px', display: 'flex', alignItems: 'center',
          }}>
            <Train size={20} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 20, color: '#f1f5f9', lineHeight: 1 }}>
              IRCTC
            </div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase' }}>
              Rail Connect
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user ? (
            <>
              <Link to="/search" style={{ textDecoration: 'none' }}>
                <button className="btn-outline" style={{ padding: '8px 16px', fontSize: 13 }}>
                  🔍 Search Trains
                </button>
              </Link>
              <Link to="/bookings" style={{ textDecoration: 'none' }}>
                <button className="btn-outline" style={{ padding: '8px 16px', fontSize: 13 }}>
                  <Ticket size={14} style={{ marginRight: 5, verticalAlign: 'middle' }} />
                  My Tickets
                </button>
              </Link>
              <button onClick={downloadLogs} className="btn-outline" style={{ padding: '8px 14px', fontSize: 13 }} title="Download accounts.txt">
                <Download size={14} />
              </button>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.05)', borderRadius: 10,
                padding: '6px 14px', border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF9933, #ea580c)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <User size={14} color="white" />
                </div>
                <span style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 500 }}>{user.name?.split(' ')[0]}</span>
              </div>
              <button onClick={handleLogout} className="btn-outline" style={{ padding: '8px 14px', fontSize: 13, borderColor: '#ef4444', color: '#f87171' }}>
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login"><button className="btn-outline" style={{ padding: '8px 20px' }}>Login</button></Link>
              <Link to="/register"><button className="btn-orange" style={{ padding: '8px 20px' }}>Register</button></Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sprout, 
  X, 
  ShieldCheck, 
  UserCheck, 
  ArrowRight, 
  Lock, 
  Mail, 
  Phone, 
  MapPin,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export const AuthModal = () => {
  const { isAuthOpen, setIsAuthOpen, setCurrentUser, switchDemoRole, showToast } = useApp();
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [selectedRole, setSelectedRole] = useState('Farmer');

  // Login Method: 'email' or 'phone'
  const [loginMethod, setLoginMethod] = useState('email');

  // Form Fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('Nashik, Maharashtra, India');

  // Validation State
  const [errorMessage, setErrorMessage] = useState('');
  const [touched, setTouched] = useState({});

  if (!isAuthOpen) return null;

  const roles = [
    { id: 'Farmer', label: 'Farmer', color: 'border-emerald-600 bg-emerald-50 text-emerald-950', icon: '🌾' },
    { id: 'Buyer', label: 'Buyer', color: 'border-blue-600 bg-blue-50 text-blue-950', icon: '🏢' },
    { id: 'Exporter', label: 'Exporter', color: 'border-amber-600 bg-amber-50 text-amber-950', icon: '🚢' },
    { id: 'Importer', label: 'Importer', color: 'border-purple-600 bg-purple-50 text-purple-950', icon: '🌍' }
  ];

  // Helper validation functions
  const isValidEmail = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val.trim());
  };

  const isValidPhone = (val) => {
    const digits = val.replace(/[^0-9]/g, '');
    return digits.length >= 10 && digits.length <= 15;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (loginMethod === 'email') {
      if (!email.trim()) {
        setErrorMessage('Please enter your email address.');
        return;
      }
      if (!isValidEmail(email)) {
        setErrorMessage('Please enter a valid email address (e.g. name@domain.com).');
        return;
      }
    } else {
      if (!phone.trim()) {
        setErrorMessage('Please enter your mobile number.');
        return;
      }
      if (!isValidPhone(phone)) {
        setErrorMessage('Please enter a valid mobile number with at least 10 digits.');
        return;
      }
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginMethod === 'email' ? email.trim() : undefined,
          mobile: loginMethod === 'phone' ? phone.trim() : undefined,
          password,
          role: selectedRole
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        showToast(`Welcome back, ${data.user.name} (${data.user.role})!`);
        setIsAuthOpen(false);
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      // fallback
      switchDemoRole(selectedRole);
      setIsAuthOpen(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('Please enter a valid full name or organization (at least 2 characters).');
      return;
    }

    if (!email.trim() || !isValidEmail(email)) {
      setErrorMessage('Please enter a valid email address (e.g. user@domain.com).');
      return;
    }

    if (!phone.trim() || !isValidPhone(phone)) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (password && password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          mobile: phone.trim(),
          password,
          role: selectedRole,
          location
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        showToast(`Account created successfully as ${data.user.role}!`);
        setIsAuthOpen(false);
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Registration failed.');
      }
    } catch (err) {
      switchDemoRole(selectedRole);
      setIsAuthOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                User Authentication & Profiles
              </span>
              <h3 className="text-xl font-black text-slate-900">AgriChain Global</h3>
            </div>
          </div>
          <button
            onClick={() => setIsAuthOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1-Click Quick Demo Sign-in Banner */}
        <div className="mb-5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            ⚡ Quick 1-Click Persona Sign-in
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  switchDemoRole(r.id);
                  setIsAuthOpen(false);
                }}
                className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 text-left text-xs font-semibold text-slate-800 transition flex items-center gap-1.5"
              >
                <span>{r.icon}</span>
                <span>{r.label} Demo</span>
              </button>
            ))}
          </div>
        </div>

        {/* Toggle Login vs Register */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Login to Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
              mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Register New Role
          </button>
        </div>

        {/* Role Selection Grid */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select Role:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {roles.map((r) => {
              const isSelected = selectedRole === r.id;
              return (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                    isSelected
                      ? `${r.color} ring-2 ring-emerald-500/30 font-bold`
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-lg">{r.icon}</span>
                  <span className="text-xs">{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={mode === 'login' ? handleLoginSubmit : handleRegisterSubmit} className="space-y-3.5 text-xs">
          {mode === 'register' ? (
            /* ================= REGISTER FIELDS ================= */
            <>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name / Organization *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel or Global Agro LLC"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Email Address *</label>
                  {email && isValidEmail(email) && (
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="e.g. farmer@agrichain.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    className={`w-full p-2.5 pl-9 rounded-xl border text-xs font-medium focus:ring-2 focus:outline-none ${
                      email && !isValidEmail(email) && touched.email
                        ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                        : 'border-slate-200 focus:ring-emerald-500'
                    }`}
                    onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
                {email && !isValidEmail(email) && touched.email && (
                  <p className="text-[11px] text-rose-600 mt-1">Please enter a valid email address (e.g. name@domain.com).</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Mobile Number *</label>
                  {phone && isValidPhone(phone) && (
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98230 12345 or 9823012345"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    className={`w-full p-2.5 pl-9 rounded-xl border text-xs font-medium focus:ring-2 focus:outline-none ${
                      phone && !isValidPhone(phone) && touched.phone
                        ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                        : 'border-slate-200 focus:ring-emerald-500'
                    }`}
                    onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
                {phone && !isValidPhone(phone) && touched.phone && (
                  <p className="text-[11px] text-rose-600 mt-1">Mobile number must contain at least 10 digits.</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password *</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 pl-9 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location / Port</label>
                <div className="relative">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2.5 pl-9 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            </>
          ) : (
            /* ================= LOGIN FIELDS ================= */
            <>
              <div>
                {/* Login Method Segmented Toggle */}
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-700">Login via:</label>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod('email');
                        setErrorMessage('');
                      }}
                      className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 ${
                        loginMethod === 'email'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Mail className="w-3 h-3" />
                      <span>Email</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod('phone');
                        setErrorMessage('');
                      }}
                      className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 ${
                        loginMethod === 'phone'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Phone className="w-3 h-3" />
                      <span>Phone</span>
                    </button>
                  </div>
                </div>

                {loginMethod === 'email' ? (
                  <div>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="e.g. farmer@agrichain.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errorMessage) setErrorMessage('');
                        }}
                        className={`w-full p-2.5 pl-9 rounded-xl border text-xs font-medium focus:ring-2 focus:outline-none ${
                          email && !isValidEmail(email) && touched.email
                            ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                            : 'border-slate-200 focus:ring-emerald-500'
                        }`}
                        onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                    {email && !isValidEmail(email) && touched.email && (
                      <p className="text-[11px] text-rose-600 mt-1">Please enter a valid email (e.g. name@domain.com).</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 98230 12345 or 9823012345"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (errorMessage) setErrorMessage('');
                        }}
                        className={`w-full p-2.5 pl-9 rounded-xl border text-xs font-medium focus:ring-2 focus:outline-none ${
                          phone && !isValidPhone(phone) && touched.phone
                            ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                            : 'border-slate-200 focus:ring-emerald-500'
                        }`}
                        onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                    {phone && !isValidPhone(phone) && touched.phone && (
                      <p className="text-[11px] text-rose-600 mt-1">Please enter a valid 10-digit mobile number.</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="••••••••"
                    defaultValue="password123"
                    className="w-full p-2.5 pl-9 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            </>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-600/20"
            >
              {mode === 'login' ? `Login as ${selectedRole}` : `Register as ${selectedRole}`}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { supabase } from '../App';

interface LoginProps {
  lang: 'bn' | 'en';
  setLang: (l: 'bn' | 'en') => void;
}

const Login: React.FC<LoginProps> = ({ lang, setLang }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const savedEmail = localStorage.getItem('remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const t = {
    title: "FIRST STEP",
    subtitle: lang === 'bn' ? 'হিসাব হবে এখন স্মার্টলি' : 'Smart Business Accounting',
    email: lang === 'bn' ? 'ইমেইল' : 'Email Address',
    pass: lang === 'bn' ? 'পাসওয়ার্ড' : 'Password',
    confirmPass: lang === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password',
    remember: lang === 'bn' ? 'মনে রাখুন' : 'Remember Me',
    loginBtn: lang === 'bn' ? 'লগইন করুন' : 'Login Now',
    signupBtn: lang === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account',
    noAccount: lang === 'bn' ? 'অ্যাকাউন্ট নেই?' : "Don't have an account?",
    hasAccount: lang === 'bn' ? 'আগে থেকেই অ্যাকাউন্ট আছে?' : "Already have an account?",
    switchToSignup: lang === 'bn' ? 'নতুন তৈরি করুন' : 'Sign Up',
    switchToLogin: lang === 'bn' ? 'লগইন করুন' : 'Login',
    errorMsg: lang === 'bn' ? 'ভুল ইমেইল বা পাসওয়ার্ড!' : 'Invalid credentials!',
    passMismatch: lang === 'bn' ? 'পাসওয়ার্ড মেলেনি!' : 'Passwords do not match!',
    signupSuccess: lang === 'bn' ? 'অ্যাকাউন্ট তৈরি হয়েছে! আপনার ইমেইল চেক করুন।' : 'Account created! Please check your email.',
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (rememberMe) {
      localStorage.setItem('remember_email', email);
    } else {
      localStorage.removeItem('remember_email');
    }

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError(t.passMismatch);
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) setError(error.message);
      else setSuccess(t.signupSuccess);
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(t.errorMsg);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-900 px-4 py-10">
      <div className="absolute top-4 right-4 no-print">
        <button 
          onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
          className="px-4 py-2 bg-white/10 text-white rounded-lg border border-white/20 hover:bg-white/20 transition text-sm font-bold"
        >
          {lang === 'bn' ? 'English' : 'বাংলা'}
        </button>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 transform -rotate-6 shadow-lg">
          <i className="fas fa-store"></i>
        </div>
        <h1 className="text-3xl font-black text-emerald-900 mb-2 tracking-tight">{t.title}</h1>
        <p className="text-gray-500 mb-8 font-medium">{t.subtitle}</p>

        <form onSubmit={handleAuth} className="space-y-4 text-left">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100 text-center">{error}</div>}
          {success && <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100 text-center">{success}</div>}
          
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">{t.email}</label>
            <div className="relative">
              <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition font-medium"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">{t.pass}</label>
            <div className="relative">
              <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition"
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">{t.confirmPass}</label>
              <div className="relative">
                <i className="fas fa-check-circle absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {!isSignUp && (
            <div className="flex items-center gap-2 ml-1">
              <input 
                type="checkbox" 
                id="rememberMe" 
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-xs font-bold text-gray-500 cursor-pointer hover:text-emerald-700 transition">
                {t.remember}
              </label>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className={`w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition transform hover:scale-[1.01] flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/20 mt-6 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? <i className="fas fa-spinner fa-spin text-lg"></i> : <i className={`fas ${isSignUp ? 'fa-user-plus' : 'fa-sign-in-alt'}`}></i>}
            {isSignUp ? t.signupBtn : t.loginBtn}
          </button>
        </form>

        <div className="mt-8 text-sm">
          <span className="text-gray-400 font-medium">
            {isSignUp ? t.hasAccount : t.noAccount}
          </span>{' '}
          <button 
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); }}
            className="text-emerald-600 font-bold hover:underline"
          >
            {isSignUp ? t.switchToLogin : t.switchToSignup}
          </button>
        </div>

        <p className="mt-8 text-[10px] text-gray-300 font-bold uppercase tracking-widest">
          Powered by Supabase Security
        </p>
      </div>
    </div>
  );
};

export default Login;
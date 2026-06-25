import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const res = await login(email, password);

    setIsLoading(false);
    if (!res.success) {
      setError(res.message || "Failed to login. Check your credentials.");
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* Brand Header */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/30">
          <img src="./logo.png" alt="Emerald Health Logo" className="h-16 w-auto object-contain" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">Welcome Back</h1>
          <p className="text-sm text-on-surface-variant mt-1">Sign in to access your clinic dashboard</p>
        </div>
      </div>

      {/* Login Card */}
      <div className="w-full bg-white/80 backdrop-blur-md border border-outline-variant/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        
        {/* Test Accounts Banner */}
        <div className="bg-surface-container-low border-b border-outline-variant/30 px-6 py-4 flex flex-wrap gap-2 justify-center">
          <span className="w-full text-center text-xs font-semibold text-on-surface-variant/70 mb-1 uppercase tracking-wider">Quick Login For Testing</span>
          <button
            type="button"
            onClick={() => { setEmail('admin@clinic.com'); setPassword('password123'); }}
            className="px-4 py-1.5 bg-white border border-outline-variant/50 rounded-full text-xs font-semibold text-primary hover:bg-primary-container/10 hover:border-primary/30 transition-all active:scale-95"
          >
            Admin Account
          </button>
          <button
            type="button"
            onClick={() => { setEmail('test_receptionist@clinic.com'); setPassword('123456'); }}
            className="px-4 py-1.5 bg-white border border-outline-variant/50 rounded-full text-xs font-semibold text-secondary hover:bg-secondary-container/10 hover:border-secondary/30 transition-all active:scale-95"
          >
            Receptionist
          </button>
          <button
            type="button"
            onClick={() => { setEmail('test_doctor@clinic.com'); setPassword('123456'); }}
            className="px-4 py-1.5 bg-white border border-outline-variant/50 rounded-full text-xs font-semibold text-tertiary hover:bg-tertiary-container/10 hover:border-tertiary/30 transition-all active:scale-95"
          >
            Doctor
          </button>
          <button
            type="button"
            onClick={() => { setEmail('test_patient@gmail.com'); setPassword('123456'); }}
            className="px-4 py-1.5 bg-white border border-outline-variant/50 rounded-full text-xs font-semibold text-primary hover:bg-primary-container/10 hover:border-primary/30 transition-all active:scale-95"
          >
            Patient
          </button>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="p-4 flex items-center gap-3 text-sm text-error bg-error-container/50 border border-error/20 rounded-xl">
                <span className="material-symbols-outlined text-[20px]">error</span>
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-on-surface">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">mail</span>
                <input
                  id="email"
                  type="email"
                  placeholder="admin@clinic.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-[48px] pr-4 py-3 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-surface-container-lowest"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-on-surface">Password</label>
                <a href="#" className="text-xs font-semibold text-primary hover:text-primary-container hover:underline transition-colors">Forgot password?</a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">lock</span>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-[48px] pr-4 py-3 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-surface-container-lowest"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-br from-primary to-[#004d34] text-white font-bold shadow-[0_4px_14px_0_rgba(0,108,73,0.39)] hover:shadow-[0_6px_20px_rgba(0,108,73,0.23)] hover:from-primary hover:to-primary disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      
      {/* Footer link */}
      <div className="mt-8 text-center text-xs font-medium text-on-surface-variant/70">
        &copy; {new Date().getFullYear()} Emerald Health CMS. All rights reserved.
      </div>

    </div>
  );
}

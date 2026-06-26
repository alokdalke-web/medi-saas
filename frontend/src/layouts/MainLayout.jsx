import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useConnection } from "../context/ConnectionContext";

export default function MainLayout() {
  const { logout, user } = useAuth();
  const { isOnline, isSyncing, pendingCount, flushSyncQueue, activeEndpoint, syncTimestamp } = useConnection();

  return (
    <div className="text-sm font-sans text-on-surface">
      {/* Desktop Navigation Drawer */}
      <aside className="fixed left-0 top-0 h-full z-50 w-[260px] bg-surface-container-lowest border-r border-outline-variant/30 hidden md:flex flex-col flex-shrink-0" id="sidebar">
        <div className="flex justify-center p-4 mt-2 mb-4 w-full">
          <img src="./logo.png" alt="Logo" className="w-full h-auto max-w-[200px] object-contain" />
        </div>

        <nav className="flex-1 space-y-2 px-4 mt-2">
          <NavLink to="/" end className={({ isActive }) => `flex items-center gap-4 rounded-lg px-4 py-2 cursor-pointer transition-all ${isActive ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
            {({ isActive }) => (
              <>
                <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>dashboard</span>
                <span className="text-sm font-bold">Dashboard</span>
              </>
            )}
          </NavLink>
          <NavLink to="/network" className={({ isActive }) => `flex items-center gap-4 rounded-lg px-4 py-2 cursor-pointer transition-colors ${isActive ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
            <span className="material-symbols-outlined">wifi</span>
            <span className="text-sm">Network Status</span>
          </NavLink>
          {user?.role === 'doctor' && (
            <NavLink to="/doctor-history" className={({ isActive }) => `flex items-center gap-4 rounded-lg px-4 py-2 cursor-pointer transition-colors ${isActive ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
              <span className="material-symbols-outlined">history</span>
              <span className="text-sm">Appointment History</span>
            </NavLink>
          )}
          {user?.role !== 'doctor' && (
            <>
              <NavLink to="/patients" className={({ isActive }) => `flex items-center gap-4 rounded-lg px-4 py-2 cursor-pointer transition-colors ${isActive ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
                <span className="material-symbols-outlined">group</span>
                <span className="text-sm">Patients</span>
              </NavLink>
              <NavLink to="/appointments" className={({ isActive }) => `flex items-center gap-4 rounded-lg px-4 py-2 cursor-pointer transition-colors ${isActive ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
                <span className="material-symbols-outlined">calendar_today</span>
                <span className="text-sm">Appointments</span>
              </NavLink>
              <NavLink to="/doctors" className={({ isActive }) => `flex items-center gap-4 rounded-lg px-4 py-2 cursor-pointer transition-colors ${isActive ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
                <span className="material-symbols-outlined">stethoscope</span>
                <span className="text-sm">Doctors</span>
              </NavLink>
            </>
          )}
          {user?.role === 'clinic_admin' && (
            <>
              <NavLink to="/users" className={({ isActive }) => `flex items-center gap-4 rounded-lg px-4 py-2 cursor-pointer transition-colors ${isActive ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
                <span className="material-symbols-outlined">badge</span>
                <span className="text-sm">Staff Members</span>
              </NavLink>
              <NavLink to="/settings" className={({ isActive }) => `flex items-center gap-4 rounded-lg px-4 py-2 cursor-pointer transition-colors ${isActive ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
                <span className="material-symbols-outlined">settings</span>
                <span className="text-sm">Clinic Settings</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="border-t border-outline-variant/20 p-6">
          <div className="flex items-center gap-4">
            {user?.role === 'clinic_admin' ? (
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 shrink-0 bg-surface-container-high">
                <img
                  src={user?.role === 'doctor'
                    ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSmpJar3igg5uikzVqjgNRMRQVxIj9cpFs5qN4Ol2idZ3osIR9mnmp3r8P02_-zE4yY1wMZvlWCjypdjyLjSrljMPFmhYOCL44TzXZhW_CHaA_mfODPYaz7frTgeyaL_N_qLPzcAXlJnGsaPIjQHVT4YrcJSC47HXw31bpnBcVeYOy9RRo9KSxMejGfBkt9KGILXevpzLcdhzk8FzOMmJHvROiSWzytDGoQXgNJcHfhCLnVboVBDQfvWX8_i6h1ifmRwogyWBtEnI'
                    : `https://i.pravatar.cc/150?u=${user?.email || 'patient'}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="text-[13px] font-bold text-on-surface truncate">{user?.name || user?.email || 'User'}</span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold truncate">{user?.role?.replace('_', ' ')}</span>
            </div>
            <button onClick={logout} className="text-on-surface-variant hover:text-primary transition-colors flex-shrink-0">
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Top App Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface-container-lowest border-b border-outline-variant/20 h-[72px] flex items-center justify-between px-6 md:pl-[284px] transition-all">
        <div className="flex items-center gap-4 md:hidden">
          <span className="material-symbols-outlined text-primary cursor-pointer active:scale-95 transition-transform">menu</span>
        </div>

        <div className="hidden md:flex">
          <span className="text-sm text-on-surface-variant">Good morning, {user?.name || user?.email || 'User'}</span>
        </div>

        <div className="flex items-center gap-6 ml-auto">
          {/* Connection Status Indicators */}
          {pendingCount > 0 && isOnline && !isSyncing && (
            <button
              onClick={flushSyncQueue}
              className="flex items-center gap-1 text-[13px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-full font-bold transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
              <span>{pendingCount} unsynced</span>
            </button>
          )}

          <div className="relative hidden sm:block">
            <input type="text" placeholder="Search patients or records..." className="bg-surface-container border border-outline-variant/20 rounded-full pl-6 pr-12 py-2.5 text-[13px] w-[320px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface" />
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-error rounded-full border border-white"></span>
            </button>
            <button className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined">help</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-[72px] md:ml-[260px] min-h-screen bg-surface flex flex-col">
        {/* Connection Banners */}
        {activeEndpoint === 'cloud' && (
          <div className="bg-orange-50 border-b border-orange-200 px-6 py-2 flex items-center gap-2 text-orange-700 text-sm">
            <span className="material-symbols-outlined text-[18px]">wifi_off</span>
            <span className="font-bold">Local Server Offline.</span>
            <span>Operating directly on Cloud API. Local features may be limited.</span>
          </div>
        )}
        {!isOnline && activeEndpoint === 'local' && (
          <div className="bg-error-container border-b border-error-container px-6 py-2 flex items-center gap-2 text-on-error-container text-sm">
            <span className="material-symbols-outlined text-[18px]">signal_disconnected</span>
            <span className="font-bold">You are offline.</span>
            <span>Operating in local mode. Changes will automatically sync when connected.</span>
          </div>
        )}
        {isSyncing && (
          <div className="bg-[#fef08a] border-b border-[#facc15] px-6 py-2 flex items-center gap-2 text-[#854d0e] text-sm">
            <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
            <span className="font-bold">Synchronizing with cloud...</span>
          </div>
        )}

        <div className="flex-1 p-6 overflow-auto">
          <Outlet key={syncTimestamp} />
        </div>
      </main>
    </div>
  );
}

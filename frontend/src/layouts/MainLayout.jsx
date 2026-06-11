import { Outlet, NavLink } from "react-router-dom";
import { HomeIcon, UserGroupIcon, UsersIcon, ArrowRightOnRectangleIcon, CalendarIcon, CloudArrowUpIcon, SignalSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from "../context/AuthContext";
import { useConnection } from "../context/ConnectionContext";

export default function MainLayout() {
  const { logout, user } = useAuth();
  const { isOnline, isSyncing, pendingCount, flushSyncQueue } = useConnection();

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar Placeholder */}
      <aside className="w-64 bg-slate-900 text-slate-300 p-4 flex flex-col">
        <h1 className="text-2xl font-bold mb-8 text-white">ClinicFlow</h1>
        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <NavLink to="/" end className={({isActive}) => `block px-4 py-2 rounded ${isActive ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                Dashboard
              </NavLink>
            </li>
            {user?.role !== 'doctor' && (
              <>
                <li>
                  <NavLink to="/patients" className={({isActive}) => `block px-4 py-2 rounded ${isActive ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                    Patients
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/appointments" className={({isActive}) => `block px-4 py-2 rounded ${isActive ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                    Appointments
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/doctors" className={({isActive}) => `block px-4 py-2 rounded ${isActive ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                    Doctors
                  </NavLink>
                </li>
              </>
            )}
            {user?.role === 'clinic_admin' && (
              <>
                <li>
                  <NavLink to="/users" className={({isActive}) => `block px-4 py-2 rounded ${isActive ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                    Staff Members
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/settings" className={({isActive}) => `block px-4 py-2 rounded ${isActive ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
                    Clinic Settings
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>
        <div className="mt-auto pt-4 border-t border-slate-800">
          <p className="text-sm font-medium text-slate-300 truncate">{user?.email}</p>
          <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">{user?.role?.replace('_', ' ')}</p>
          <button onClick={logout} className="w-full text-left px-4 py-2 hover:bg-slate-800 hover:text-white rounded transition-colors">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header Placeholder */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">Overview</h2>
          
          {/* Status Indicators */}
          <div className="flex items-center space-x-4">
            {pendingCount > 0 && isOnline && !isSyncing && (
              <button 
                onClick={flushSyncQueue}
                className="flex items-center space-x-1 text-sm text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full font-medium"
              >
                <CloudArrowUpIcon className="h-4 w-4" />
                <span>{pendingCount} unsynced</span>
              </button>
            )}
          </div>
        </header>

        {/* Connection Banner */}
        {!isOnline && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-2 flex items-center space-x-2 text-red-700 text-sm">
            <SignalSlashIcon className="h-4 w-4" />
            <span className="font-medium">You are offline.</span>
            <span>Operating in local mode. Changes will automatically sync when connected.</span>
          </div>
        )}
        {isSyncing && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2 flex items-center space-x-2 text-yellow-700 text-sm">
            <svg className="animate-spin h-4 w-4 text-yellow-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="font-medium">Synchronizing with cloud...</span>
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 p-6 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

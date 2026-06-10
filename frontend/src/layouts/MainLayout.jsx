import { Outlet, NavLink } from "react-router-dom";
import { HomeIcon, UserGroupIcon, UsersIcon, ArrowRightOnRectangleIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useAuth } from "../context/AuthContext";

export default function MainLayout() {
  const { logout, user } = useAuth();

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
        <header className="h-16 bg-white shadow-sm flex items-center px-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">Overview</h2>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

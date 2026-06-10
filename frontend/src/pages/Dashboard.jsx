import { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserGroupIcon, CalendarIcon, UsersIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

function StatCard({ title, value, icon: Icon, colorClass }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center space-x-4">
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function AdminDashboard({ stats }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard title="Total Patients" value={stats.totalPatients || 0} icon={UsersIcon} colorClass="bg-blue-500" />
        <StatCard title="Total Doctors" value={stats.totalDoctors || 0} icon={UserGroupIcon} colorClass="bg-indigo-500" />
        <StatCard title="Total Appointments" value={stats.totalAppointments || 0} icon={CalendarIcon} colorClass="bg-purple-500" />
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-medium text-slate-800">Recent Appointments</h3>
        </div>
        <ul className="divide-y divide-slate-100">
          {stats.recentAppointments?.map(apt => (
            <li key={apt._id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">{apt.patientId?.firstName} {apt.patientId?.lastName}</p>
                <p className="text-xs text-slate-500">Dr. {apt.doctorId?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-800">{new Date(apt.appointmentDate).toLocaleDateString()}</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                  {apt.status}
                </span>
              </div>
            </li>
          ))}
          {!stats.recentAppointments?.length && (
            <li className="px-6 py-8 text-center text-slate-500 text-sm">No recent appointments found.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function DoctorDashboard({ stats }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard title="Today's Appointments" value={stats.todaysAppointments || 0} icon={CalendarIcon} colorClass="bg-indigo-500" />
        <StatCard title="Total Patients Treated" value={stats.totalPatientsTreated || 0} icon={UsersIcon} colorClass="bg-emerald-500" />
        <StatCard title="Pending Queue" value={stats.upcomingAppointments?.length || 0} icon={ClockIcon} colorClass="bg-amber-500" />
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-medium text-slate-800">Your Upcoming Schedule</h3>
        </div>
        <ul className="divide-y divide-slate-100">
          {stats.upcomingAppointments?.map(apt => (
            <li key={apt._id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">{apt.patientId?.firstName} {apt.patientId?.lastName}</p>
                <p className="text-xs text-slate-500">Time: {apt.appointmentTime}</p>
              </div>
              <div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  apt.status === 'checked_in' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {apt.status === 'checked_in' ? 'Waiting outside' : 'Scheduled'}
                </span>
              </div>
            </li>
          ))}
          {!stats.upcomingAppointments?.length && (
            <li className="px-6 py-8 text-center text-slate-500 text-sm">No upcoming appointments for today.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function ReceptionistDashboard({ stats, refresh }) {
  const handleCheckIn = async (id) => {
    try {
      await fetchApi(`/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'checked_in' })
      });
      refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard title="Total Today" value={stats.totalToday || 0} icon={CalendarIcon} colorClass="bg-blue-500" />
        <StatCard title="Checked In" value={stats.checkedInToday || 0} icon={CheckCircleIcon} colorClass="bg-green-500" />
        <StatCard title="Scheduled" value={stats.scheduledToday || 0} icon={ClockIcon} colorClass="bg-amber-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-medium text-slate-800">Today's Live Queue</h3>
          <button onClick={refresh} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Refresh</button>
        </div>
        <ul className="divide-y divide-slate-100">
          {stats.todayQueue?.map(apt => (
            <li key={apt._id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium">
                  {apt.patientId?.firstName?.[0]}{apt.patientId?.lastName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{apt.patientId?.firstName} {apt.patientId?.lastName}</p>
                  <p className="text-xs text-slate-500">Dr. {apt.doctorId?.name} • {apt.appointmentTime}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  apt.status === 'checked_in' ? 'bg-yellow-100 text-yellow-800' : 
                  apt.status === 'in_consultation' ? 'bg-purple-100 text-purple-800' :
                  apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {apt.status.replace('_', ' ').toUpperCase()}
                </span>
                
                {apt.status === 'scheduled' && (
                  <button 
                    onClick={() => handleCheckIn(apt._id)}
                    className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded hover:bg-indigo-100"
                  >
                    Check In
                  </button>
                )}
              </div>
            </li>
          ))}
          {!stats.todayQueue?.length && (
            <li className="px-6 py-8 text-center text-slate-500 text-sm">No appointments scheduled for today.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/dashboard');
      setStats(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // If receptionist, auto-poll every 30 seconds for live queue updates
    let interval;
    if (user?.role === 'receptionist') {
      interval = setInterval(fetchStats, 30000);
    }
    return () => clearInterval(interval);
  }, [user]);

  if (loading && !stats) {
    return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Welcome back, {user?.name || 'User'}
        </h1>
        <p className="text-slate-500 mt-1">Here's what's happening at your clinic today.</p>
      </div>

      {user?.role === 'clinic_admin' && <AdminDashboard stats={stats} />}
      {user?.role === 'doctor' && <DoctorDashboard stats={stats} />}
      {user?.role === 'receptionist' && <ReceptionistDashboard stats={stats} refresh={fetchStats} />}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

function timeAgo(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + "y ago";
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + "mo ago";
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + "d ago";
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + "h ago";
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + "m ago";
  return Math.floor(seconds) + "s ago";
}

function StatCard({ title, value, icon, bgClass, textClass, trend }) {
  return (
    <div className="card p-6">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 rounded-lg ${bgClass} flex items-center justify-center`}>
          <span className={`material-symbols-outlined ${textClass}`}>{icon}</span>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 font-bold text-xs tracking-wide ${trend.value.startsWith('+') ? 'text-primary' : 'text-error'}`}>
            <span className="material-symbols-outlined text-[16px]">
              {trend.value.startsWith('+') ? 'trending_up' : 'trending_down'}
            </span>
            {trend.value}
          </div>
        )}
      </div>
      <div className="text-[11px] uppercase tracking-[0.05em] text-on-surface-variant font-bold mb-1">{title}</div>
      <div className="text-[28px] font-bold text-on-surface leading-tight">{value}</div>
    </div>
  );
}

function AdminDashboard({ stats }) {
  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface mb-1">Clinic Overview</h1>
          <p className="text-base text-on-surface-variant">You have <span className="text-primary font-bold">{stats.todaysAppointments || 12} appointments</span> scheduled for today.</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-surface-container-low border border-outline-variant/30 text-on-surface font-bold px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[20px]">file_download</span>
            Export Report
          </button>
          <button className="bg-primary text-white font-bold px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 hover:brightness-110 shadow-sm transition-all">
            <span className="material-symbols-outlined text-[20px]">add</span>
            New Appointment
          </button>
        </div>
      </section>

      {/* Metrics Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Total Patients" value={stats.totalPatients?.toLocaleString() || "1,482"} icon="group" bgClass="bg-[#dcfce7]" textClass="text-primary" trend={{value: "+12%"}} />
        <StatCard title="Total Doctors" value={stats.totalDoctors?.toLocaleString() || "45"} icon="stethoscope" bgClass="bg-[#dbeafe]" textClass="text-secondary" trend={{value: "+8.4%"}} />
        <StatCard title="Total Appointments" value={stats.totalAppointments?.toLocaleString() || "42,500"} icon="calendar_clock" bgClass="bg-[#f3e8ff]" textClass="text-tertiary" trend={{value: "+5%"}} />
        <StatCard title="Patient Rating" value="4.9/5" icon="verified" bgClass="bg-[#dcfce7]" textClass="text-primary" trend={{value: "+5%"}} />
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Analytics */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h2 className="text-[20px] font-bold text-on-surface mb-1">Clinic Analytics</h2>
              <p className="text-sm text-on-surface-variant">Visualizing monthly growth</p>
            </div>
            <button className="bg-surface-container text-on-surface font-bold text-[12px] px-3 py-1.5 rounded-[8px] hover:bg-surface-container-high transition-colors">
              Last 6 Months
            </button>
          </div>
          
          <div className="flex items-end justify-between h-[200px] px-2 mt-8 relative">
            <div className="w-[12%] bg-surface-container-high rounded-t-[6px] h-[35%]"></div>
            <div className="w-[12%] bg-surface-container-high rounded-t-[6px] h-[55%]"></div>
            <div className="w-[12%] bg-surface-container-high rounded-t-[6px] h-[45%]"></div>
            <div className="w-[12%] bg-surface-container-high rounded-t-[6px] h-[75%]"></div>
            <div className="w-[12%] bg-primary rounded-t-[6px] h-[95%] shadow-sm"></div>
            <div className="w-[12%] bg-surface-container-high rounded-t-[6px] h-[25%]"></div>
          </div>
          
          <div className="flex justify-between mt-6 px-2 text-[12px] font-bold text-on-surface-variant">
            <span className="w-[12%] text-center">JAN</span>
            <span className="w-[12%] text-center">FEB</span>
            <span className="w-[12%] text-center">MAR</span>
            <span className="w-[12%] text-center">APR</span>
            <span className="w-[12%] text-center text-primary">MAY</span>
            <span className="w-[12%] text-center">JUN</span>
          </div>
        </div>

        {/* Appointment Trends */}
        <div className="card p-6 flex flex-col">
          <div className="mb-6">
            <h2 className="text-[20px] font-bold text-on-surface mb-1">Appointment Trends</h2>
            <p className="text-sm text-on-surface-variant">Capacity vs Bookings</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-[180px] h-[180px] mb-6 mt-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="90" cy="90" r="76" fill="transparent" stroke="#e2e8f0" strokeWidth="14"></circle>
                <circle cx="90" cy="90" r="76" fill="transparent" stroke="#006c49" strokeWidth="14" strokeDasharray="477.5" strokeDashoffset="119.3" strokeLinecap="round"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[32px] font-bold text-on-surface">75%</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mt-1">Capacity</span>
              </div>
            </div>
            
            <div className="w-full space-y-3 px-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-[13px] text-on-surface">Booked Slots</span>
                </div>
                <span className="font-bold text-[14px] text-on-surface">{stats.totalAppointments || 120}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#dce9ff]"></div>
                  <span className="text-[13px] text-on-surface">Available Slots</span>
                </div>
                <span className="font-bold text-[14px] text-on-surface">40</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lower Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <div className="lg:col-span-2 card overflow-hidden flex flex-col">
          <div className="p-6 flex justify-between items-center border-b border-outline-variant/20">
            <h2 className="text-[20px] font-bold text-on-surface">Recent Appointments</h2>
            <a href="#" className="text-primary font-bold text-[13px] hover:underline">View All</a>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead className="text-[12px] text-on-surface-variant border-b border-outline-variant/20">
                <tr>
                  <th className="px-6 py-4 font-bold">Patient</th>
                  <th className="px-6 py-4 font-bold">Doctor</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-sm">
                {stats.recentAppointments?.map((apt, i) => (
                  <tr key={apt._id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
                          {apt.patientId?.firstName?.[0] || ''}{apt.patientId?.lastName?.[0] || ''}
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">{apt.patientId?.firstName} {apt.patientId?.lastName}</p>
                          <p className="text-[12px] text-on-surface-variant">ID: #{apt.patientId?._id?.slice(-4) || '0000'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-on-surface">Dr. {apt.doctorId?.name}</td>
                    <td className="px-6 py-4 text-on-surface">{new Date(apt.appointmentDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-[12px] font-bold ${
                        apt.status === 'scheduled' ? 'bg-[#dcfce7] text-[#166534]' :
                        apt.status === 'completed' ? 'bg-[#dcfce7] text-[#166534]' :
                        apt.status === 'checked_in' ? 'bg-[#dbeafe] text-[#1e40af]' :
                        'bg-[#e2e8f0] text-[#475569]'
                      }`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-on-surface-variant hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {!stats.recentAppointments?.length && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-on-surface-variant text-sm">No recent appointments found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="card p-6">
          <h2 className="text-[20px] font-bold text-on-surface mb-6">Activity Feed</h2>
          
          <div className="space-y-6 relative ml-1 mt-4">
            {stats.activities?.map((activity) => (
              <div key={activity.id} className="relative pl-10 timeline-item">
                <div className="timeline-line"></div>
                <div className={`absolute left-0 top-0 w-6 h-6 rounded-full ${activity.colorClass} flex items-center justify-center z-10 ring-[6px] ring-white`}>
                  <span className={`material-symbols-outlined text-[14px] ${activity.iconColor}`}>{activity.icon}</span>
                </div>
                <div>
                  <p className="font-bold text-on-surface text-sm">{activity.title}</p>
                  <p className="text-[13px] text-on-surface-variant mt-1 leading-relaxed">{activity.description}</p>
                  <p className="text-xs font-mono text-outline mt-2">{timeAgo(activity.timestamp)}</p>
                </div>
              </div>
            ))}
            {!stats.activities?.length && (
              <p className="text-[13px] text-on-surface-variant text-center">No recent activity.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function DoctorDashboard({ stats, user }) {
  const todayDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const todaysCount = stats.todaysAppointments || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-surface mb-2">Good morning, Dr. {user?.name?.split(' ')[1] || user?.name || 'Doctor'}</h1>
          <p className="text-base text-on-surface-variant">
            You have <span className="text-primary font-bold">{todaysCount} appointments</span> today.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-xl text-primary font-bold text-sm hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            {todayDate}
          </button>
        </div>
      </section>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Daily Schedule Widget */}
        <div className="md:col-span-8 bg-white/80 backdrop-blur-md border border-outline-variant/30 rounded-xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-on-surface">Daily Schedule</h2>
            <button className="text-primary text-sm font-bold hover:underline">View All</button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {stats.upcomingAppointments?.map((apt, index) => {
              const isCritical = apt.status === 'waitlisted'; // Just a visual mock logic
              return (
                <div key={apt._id} className={`flex-shrink-0 w-64 p-4 bg-surface-container-low rounded-xl border ${isCritical ? 'border-l-4 border-l-error' : ''} border-outline-variant/50 hover:border-primary/40 transition-all cursor-pointer`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${isCritical ? 'bg-error-container text-on-error-container' : 'bg-primary-container/20 text-primary'}`}>
                      {apt.appointmentTime}
                    </span>
                    <span className={`material-symbols-outlined text-[20px] ${isCritical ? 'text-error' : 'text-primary'}`}>
                      {isCritical ? 'priority_high' : 'more_horiz'}
                    </span>
                  </div>
                  <h3 className="font-bold text-on-surface mb-1">{apt.patientId?.firstName} {apt.patientId?.lastName}</h3>
                  <p className="text-xs font-semibold text-on-surface-variant">Consultation</p>
                  
                  {isCritical && (
                    <div className="mt-4 flex items-center gap-1 text-error font-bold text-[10px]">
                      <span className="material-symbols-outlined text-[14px]">emergency</span>
                      CRITICAL
                    </div>
                  )}
                  {!isCritical && (
                    <div className="mt-4 flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-secondary-container text-[10px] flex items-center justify-center text-white border border-surface">
                        {apt.patientId?.firstName?.[0] || ''}{apt.patientId?.lastName?.[0] || ''}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {!stats.upcomingAppointments?.length && (
              <div className="text-sm text-on-surface-variant py-4">No appointments scheduled.</div>
            )}
          </div>
        </div>

        {/* Stats Cards Cluster */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="bg-white/80 backdrop-blur-md border border-outline-variant/30 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:-translate-y-0.5 transition-transform">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">timer</span>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant">Avg. Consultation</p>
              <h4 className="text-2xl font-bold text-on-surface">18.5 min</h4>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-md border border-outline-variant/30 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:-translate-y-0.5 transition-transform">
            <div className="w-12 h-12 rounded-xl bg-tertiary-container/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary">sentiment_very_satisfied</span>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant">Patient Satisfaction</p>
              <h4 className="text-2xl font-bold text-on-surface">94.2%</h4>
            </div>
          </div>
        </div>

        {/* Patient Alerts & Vitals */}
        <div className="md:col-span-8 bg-white/80 backdrop-blur-md border border-outline-variant/30 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-on-surface">Patient Alerts & Vitals</h2>
            <span className="material-symbols-outlined text-on-surface-variant cursor-pointer">filter_list</span>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-error-container/10 border border-error/20 rounded-xl gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-error">blood_pressure</span>
                </div>
                <div>
                  <h4 className="font-bold text-on-surface">Marcus Thorne</h4>
                  <p className="text-xs font-bold text-error">High Blood Pressure: 165/105</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-error text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity">Review</button>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-primary-container/5 border border-primary/20 rounded-xl gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary">lab_research</span>
                </div>
                <div>
                  <h4 className="font-bold text-on-surface">Elena Rodriguez</h4>
                  <p className="text-xs font-bold text-on-surface-variant">CBC Results Available</p>
                </div>
              </div>
              <button className="px-4 py-2 border border-primary text-primary text-xs font-bold rounded-lg hover:bg-primary/5 transition-colors">View Lab</button>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="md:col-span-4 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-on-surface">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="flex flex-col items-center justify-center gap-2 p-6 bg-white/80 backdrop-blur-md border border-outline-variant/30 rounded-xl hover:bg-primary-container/5 hover:border-primary/40 transition-all group shadow-sm">
              <span className="material-symbols-outlined text-primary text-[32px] group-hover:scale-110 transition-transform">note_add</span>
              <span className="text-xs font-bold text-on-surface-variant">Add Note</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-2 p-6 bg-white/80 backdrop-blur-md border border-outline-variant/30 rounded-xl hover:bg-primary-container/5 hover:border-primary/40 transition-all group shadow-sm">
              <span className="material-symbols-outlined text-primary text-[32px] group-hover:scale-110 transition-transform">prescriptions</span>
              <span className="text-xs font-bold text-on-surface-variant">Prescribe</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-2 p-6 bg-white/80 backdrop-blur-md border border-outline-variant/30 rounded-xl hover:bg-primary-container/5 hover:border-primary/40 transition-all group shadow-sm">
              <span className="material-symbols-outlined text-primary text-[32px] group-hover:scale-110 transition-transform">forward_to_inbox</span>
              <span className="text-xs font-bold text-on-surface-variant">Referral</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-2 p-6 bg-gradient-to-br from-[#10b981] to-[#006c49] text-white rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[32px]">add</span>
              <span className="text-xs font-bold">New Visit</span>
            </button>
          </div>
        </div>

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
        <StatCard title="Total Today" value={stats.todaysAppointments || 0} icon="calendar_today" bgClass="bg-[#dbeafe]" textClass="text-secondary" />
        <StatCard title="Checked In" value={stats.recentAppointments?.filter(a => a.status === 'checked_in').length || 0} icon="check_circle" bgClass="bg-[#dcfce7]" textClass="text-primary" />
        <StatCard title="Scheduled" value={stats.recentAppointments?.filter(a => a.status === 'scheduled').length || 0} icon="schedule" bgClass="bg-[#fef3c7]" textClass="text-amber-600" />
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/20 flex justify-between items-center">
          <h3 className="text-[20px] font-bold text-on-surface">Today's Live Queue</h3>
          <button onClick={refresh} className="text-[13px] text-primary hover:brightness-110 font-bold">Refresh</button>
        </div>
        <ul className="divide-y divide-outline-variant/10">
          {stats.todayQueue?.map(apt => (
            <li key={apt._id} className="px-6 py-4 flex items-center justify-between hover:bg-surface-container-low transition-colors">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant font-bold">
                  {apt.patientId?.firstName?.[0]}{apt.patientId?.lastName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">{apt.patientId?.firstName} {apt.patientId?.lastName}</p>
                  <p className="text-[12px] text-on-surface-variant">Dr. {apt.doctorId?.name} • {apt.appointmentTime}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold ${
                  apt.status === 'waitlisted' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                  apt.status === 'checked_in' ? 'bg-[#fef3c7] text-[#92400e]' : 
                  apt.status === 'in_consultation' ? 'bg-[#f3e8ff] text-[#6b21a8]' :
                  apt.status === 'completed' ? 'bg-[#dcfce7] text-[#166534]' :
                  'bg-[#dbeafe] text-[#1e40af]'
                }`}>
                  {apt.status === 'waitlisted' ? '⚠️ WAITLISTED' : apt.status.replace('_', ' ').toUpperCase()}
                </span>
                
                {apt.status === 'scheduled' && (
                  <button 
                    onClick={() => handleCheckIn(apt._id)}
                    className="px-3 py-1 bg-surface-container-low text-primary text-[12px] font-bold rounded hover:bg-surface-container-high transition-colors"
                  >
                    Check In
                  </button>
                )}
              </div>
            </li>
          ))}
          {!stats.todayQueue?.length && (
            <li className="px-6 py-8 text-center text-on-surface-variant text-sm">No appointments scheduled for today.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function PatientDashboard({ stats }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <StatCard title="Upcoming Appointments" value={stats.upcomingAppointments?.length || 0} icon="event" bgClass="bg-[#dbeafe]" textClass="text-secondary" />
        <StatCard title="Past Appointments" value={stats.pastAppointments?.length || 0} icon="history" bgClass="bg-[#f3e8ff]" textClass="text-tertiary" />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/20 flex justify-between items-center">
            <h3 className="text-[20px] font-bold text-on-surface">Upcoming Appointments</h3>
          </div>
          <ul className="divide-y divide-outline-variant/10">
            {stats.upcomingAppointments?.map(apt => (
              <li key={apt._id} className="px-6 py-4 flex flex-col gap-2">
                <div className="flex justify-between">
                  <p className="text-sm font-bold text-on-surface">Dr. {apt.doctorId?.name}</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold ${
                    apt.status === 'scheduled' ? 'bg-[#dbeafe] text-[#1e40af]' : 'bg-[#fef3c7] text-[#92400e]'
                  }`}>
                    {apt.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-[12px] text-on-surface-variant">{apt.doctorId?.specialization || 'General'} • {new Date(apt.appointmentDate).toLocaleDateString()} at {apt.appointmentTime}</p>
              </li>
            ))}
            {!stats.upcomingAppointments?.length && (
              <li className="px-6 py-8 text-center text-on-surface-variant text-sm">No upcoming appointments.</li>
            )}
          </ul>
        </div>

        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/20 flex justify-between items-center">
            <h3 className="text-[20px] font-bold text-on-surface">Past Appointments</h3>
          </div>
          <ul className="divide-y divide-outline-variant/10">
            {stats.pastAppointments?.map(apt => (
              <li key={apt._id} className="px-6 py-4 flex flex-col gap-2">
                <div className="flex justify-between">
                  <p className="text-sm font-bold text-on-surface">Dr. {apt.doctorId?.name}</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-[#e2e8f0] text-[#475569]">
                    {apt.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-[12px] text-on-surface-variant">{apt.doctorId?.specialization || 'General'} • {new Date(apt.appointmentDate).toLocaleDateString()} at {apt.appointmentTime}</p>
              </li>
            ))}
            {!stats.pastAppointments?.length && (
              <li className="px-6 py-8 text-center text-on-surface-variant text-sm">No past appointments.</li>
            )}
          </ul>
        </div>
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
    
    // Listen for real-time P2P sync events from other nodes
    const handleSyncUpdate = () => {
      console.log('[Dashboard] P2P Sync Update received, refreshing stats...');
      fetchStats();
    };
    window.addEventListener('p2p-sync-update', handleSyncUpdate);
    
    // If receptionist, auto-poll every 30 seconds for live queue updates
    let interval;
    if (user?.role === 'receptionist') {
      interval = setInterval(fetchStats, 30000);
    }
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('p2p-sync-update', handleSyncUpdate);
    };
  }, [user]);

  if (loading && !stats) {
    return <div className="p-8 text-center text-on-surface-variant">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-error bg-error-container rounded-lg">{error}</div>;
  }

  // Admin Dashboard has its own hero section in the mockup, so we don't render the generic one.
  return (
    <div className="text-sm font-sans">
      {user?.role !== 'clinic_admin' && user?.role !== 'doctor' && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-on-surface">
            Welcome back, {user?.name || 'User'}
          </h1>
          <p className="text-on-surface-variant mt-1">Here's what's happening at your clinic today.</p>
        </div>
      )}

      {user?.role === 'clinic_admin' && <AdminDashboard stats={stats} />}
      {user?.role === 'doctor' && <DoctorDashboard stats={stats} user={user} />}
      {user?.role === 'receptionist' && <ReceptionistDashboard stats={stats} refresh={fetchStats} />}
      {user?.role === 'patient' && <PatientDashboard stats={stats} />}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { fetchApi } from '../../services/api';
import AppointmentFormDialog from './AppointmentFormDialog';

export default function AppointmentsList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]); // Today
  const [filterType, setFilterType] = useState('All'); // 'All', 'My Appointments', 'Pending'

  const openReschedule = (apt) => {
    setEditingAppointment(apt);
    setIsFormOpen(true);
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetchApi(`/appointments?date=${filterDate}`);
      setAppointments(res.data.appointments);
    } catch (err) {
      setError(err.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();

    const handleSync = (e) => {
      // Refresh if the sync event touched appointments or patients
      if (e.detail?.entityType === 'appointments' || e.detail?.entityType === 'patients') {
        fetchAppointments();
      }
    };
    
    window.addEventListener('p2p-sync-update', handleSync);
    return () => window.removeEventListener('p2p-sync-update', handleSync);
  }, [filterDate]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await fetchApi(`/appointments/${id}`, { 
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      fetchAppointments();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to permanently delete this appointment?')) {
      try {
        await fetchApi(`/appointments/${id}`, { method: 'DELETE' });
        fetchAppointments();
      } catch (err) {
        alert(err.message || 'Failed to delete appointment');
      }
    }
  };

  // Filter the appointments based on filterType
  const filteredAppointments = appointments.filter(apt => {
    if (filterType === 'Pending') {
      return apt.status === 'scheduled' || apt.status === 'waitlisted';
    }
    // Assume 'My Appointments' is not fully implemented on backend, just filter locally if we had current userId
    // For now we'll just show all for 'My Appointments' or you can filter by doctorId
    return true; 
  });

  const getStatusInfo = (status) => {
    switch(status) {
      case 'scheduled': return { label: 'Scheduled', style: 'bg-primary-container/20 text-on-primary-container border-primary-container/30' };
      case 'checked_in': return { label: 'Checked-in', style: 'bg-primary-container/20 text-on-primary-container border-primary-container/30' };
      case 'in_consultation': return { label: 'In Consult', style: 'bg-tertiary-container/20 text-tertiary border-tertiary-container/30' };
      case 'completed': return { label: 'Completed', style: 'bg-secondary-container/10 text-secondary border-secondary-container/20' };
      case 'cancelled': return { label: 'Cancelled', style: 'bg-error-container text-on-error-container border-error/10' };
      case 'waitlisted': return { label: 'Waitlisted', style: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30' };
      default: return { label: status, style: 'bg-surface-container text-on-surface-variant border-outline-variant/30' };
    }
  };

  const formatTime = (timeStr) => {
    // Assuming timeStr is "14:30"
    if (!timeStr) return { time: '--:--', period: '--' };
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return { time: `${h12.toString().padStart(2, '0')}:${minutes}`, period: ampm };
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface/80 backdrop-blur-md pb-4 border-b border-outline-variant/30">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-primary">Appointments</h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="flex items-center gap-1 px-4 py-2 rounded-full bg-surface-container-high/50 hover:bg-surface-container-high transition-colors text-sm font-semibold tracking-wide text-on-surface-variant cursor-pointer border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button 
            onClick={() => { setEditingAppointment(null); setIsFormOpen(true); }}
            className="px-6 py-2 rounded-full bg-primary text-white text-xs font-semibold tracking-wide transition-all shadow-md active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Appointment
          </button>
        </div>
      </header>

      {error && <div className="text-error bg-error-container p-4 rounded-md">{error}</div>}

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 mb-10">
        {['All', 'My Appointments', 'Pending'].map((type) => (
          <button 
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-6 py-2 rounded-full text-xs font-semibold tracking-wide transition-all active:scale-95 ${
              filterType === type 
                ? 'bg-primary text-white shadow-md' 
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Calendar List View */}
      <div className="relative space-y-4 pb-12 before:content-[''] before:absolute before:left-[84px] before:top-0 before:bottom-0 before:w-px before:bg-outline-variant before:opacity-30">
        
        {loading ? (
          <div className="text-center p-8 text-on-surface-variant">Loading appointments...</div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center p-8 text-on-surface-variant bg-surface-container-low/50 border border-dashed border-outline-variant rounded-xl">No appointments found for this filter.</div>
        ) : (
          filteredAppointments.map((apt) => {
            const { time, period } = formatTime(apt.appointmentTime);
            const statusInfo = getStatusInfo(apt.status);
            const isCancelled = apt.status === 'cancelled';
            
            return (
              <div key={apt._id} className={`flex gap-6 group ${isCancelled ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                <div className="w-16 flex flex-col items-end pt-2">
                  <span className={`text-xs font-bold ${isCancelled ? 'text-on-surface-variant' : 'text-primary'}`}>{time}</span>
                  <span className="text-[10px] text-on-surface-variant font-mono">{period}</span>
                </div>
                
                <div className="flex-1 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center gap-4 group-hover:border-primary-container/50">
                  <div className="hidden sm:block text-outline-variant opacity-40 group-hover:opacity-100 transition-opacity cursor-grab">
                    <span className="material-symbols-outlined">drag_indicator</span>
                  </div>
                  
                  <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg flex-shrink-0 overflow-hidden">
                    {apt.patientId?.profile_picture ? (
                      <img src={apt.patientId.profile_picture} alt={`${apt.patientId.firstName} ${apt.patientId.lastName}`} className="w-full h-full object-cover" />
                    ) : (
                      `${apt.patientId?.firstName?.[0] || ''}${apt.patientId?.lastName?.[0] || ''}`
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-base font-bold truncate ${isCancelled ? 'line-through text-on-surface-variant/50' : 'text-on-surface'}`}>
                      {apt.patientId?.firstName} {apt.patientId?.lastName}
                    </h3>
                    <p className={`text-sm ${isCancelled ? 'text-on-surface-variant/50' : 'text-on-surface-variant'} truncate`}>
                      {apt.reason || 'Consultation'} with <span className="font-semibold text-primary">Dr. {apt.doctorId?.name}</span>
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1 flex-shrink-0 mt-2 sm:mt-0">
                    <span className={`px-2 py-[2px] rounded-full text-[11px] font-bold border uppercase tracking-wider ${statusInfo.style}`}>
                      {statusInfo.label}
                    </span>
                    <span className="text-[11px] text-on-surface-variant font-mono">#{apt.patientId?.patientId || 'NEW'}</span>
                  </div>
                  
                  {/* Action Buttons Integrated */}
                  <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-outline-variant/20 flex-wrap justify-end">
                    {apt.status === 'scheduled' && (
                      <button onClick={() => handleStatusChange(apt._id, 'checked_in')} className="px-3 py-1 bg-surface-container hover:bg-surface-container-high rounded text-xs font-semibold text-primary transition-colors">
                        Check In
                      </button>
                    )}
                    {apt.status === 'checked_in' && (
                      <button onClick={() => handleStatusChange(apt._id, 'in_consultation')} className="px-3 py-1 bg-surface-container hover:bg-surface-container-high rounded text-xs font-semibold text-tertiary transition-colors">
                        Start Consult
                      </button>
                    )}
                    {apt.status === 'in_consultation' && (
                      <button onClick={() => handleStatusChange(apt._id, 'completed')} className="px-3 py-1 bg-surface-container hover:bg-surface-container-high rounded text-xs font-semibold text-secondary transition-colors">
                        Complete
                      </button>
                    )}
                    {['scheduled', 'checked_in'].includes(apt.status) && (
                      <button onClick={() => handleStatusChange(apt._id, 'cancelled')} className="px-3 py-1 bg-error-container/20 hover:bg-error-container/50 rounded text-xs font-semibold text-error transition-colors">
                        Cancel
                      </button>
                    )}
                    {apt.status === 'waitlisted' && (
                      <button onClick={() => openReschedule(apt)} className="px-3 py-1 bg-surface-container hover:bg-surface-container-high rounded text-xs font-semibold text-on-surface-variant transition-colors">
                        Reschedule
                      </button>
                    )}
                    <button onClick={() => handleDelete(apt._id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-error-container/50 text-error transition-colors ml-2">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AppointmentFormDialog 
        isOpen={isFormOpen} 
        onClose={() => { setIsFormOpen(false); setEditingAppointment(null); }} 
        appointmentData={editingAppointment}
        onSuccess={() => {
          setIsFormOpen(false);
          setEditingAppointment(null);
          fetchAppointments();
        }}
      />
    </div>
  );
}

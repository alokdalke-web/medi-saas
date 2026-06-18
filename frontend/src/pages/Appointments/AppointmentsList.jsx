import { useState, useEffect } from 'react';
import { fetchApi } from '../../services/api';
import AppointmentFormDialog from './AppointmentFormDialog';
import { 
  CalendarIcon, 
  ClockIcon, 
  UserIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  PlayIcon,
  StopIcon
} from '@heroicons/react/24/outline';

export default function AppointmentsList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]); // Today

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

  const getStatusBadge = (status) => {
    const styles = {
      scheduled: 'bg-blue-100 text-blue-800',
      checked_in: 'bg-yellow-100 text-yellow-800',
      in_consultation: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status]}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading && appointments.length === 0) return <div className="text-center p-8">Loading appointments...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <div className="flex space-x-4">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
          />
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            New Appointment
          </button>
        </div>
      </div>

      {error && <div className="text-red-600 bg-red-50 p-4 rounded-md">{error}</div>}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {appointments.length === 0 ? (
            <li className="p-8 text-center text-gray-500">No appointments scheduled for this date.</li>
          ) : (
            appointments.map((apt) => (
              <li key={apt._id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
                          <span className="text-indigo-600 font-medium text-lg">
                            {apt.patientId?.firstName?.[0]}{apt.patientId?.lastName?.[0]}
                          </span>
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {apt.patientId?.firstName} {apt.patientId?.lastName} ({apt.patientId?.patientId})
                        </p>
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          <UserIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          Dr. {apt.doctorId?.name} ({apt.doctorId?.specialization})
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex space-x-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {new Date(apt.appointmentDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {apt.appointmentTime}
                        </span>
                      </div>
                      <div>{getStatusBadge(apt.status)}</div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="mt-4 flex space-x-3 justify-end border-t border-gray-100 pt-3">
                    {apt.status === 'scheduled' && (
                      <button
                        onClick={() => handleStatusChange(apt._id, 'checked_in')}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
                      >
                        <CheckCircleIcon className="mr-1.5 h-4 w-4" /> Check In
                      </button>
                    )}
                    {apt.status === 'checked_in' && (
                      <button
                        onClick={() => handleStatusChange(apt._id, 'in_consultation')}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200"
                      >
                        <PlayIcon className="mr-1.5 h-4 w-4" /> Start Consult
                      </button>
                    )}
                    {apt.status === 'in_consultation' && (
                      <button
                        onClick={() => handleStatusChange(apt._id, 'completed')}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                      >
                        <StopIcon className="mr-1.5 h-4 w-4" /> Complete
                      </button>
                    )}
                    {['scheduled', 'checked_in'].includes(apt.status) && (
                      <button
                        onClick={() => handleStatusChange(apt._id, 'cancelled')}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                      >
                        <XCircleIcon className="mr-1.5 h-4 w-4" /> Cancel
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(apt._id)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 ml-2"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <AppointmentFormDialog 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSuccess={() => {
          setIsFormOpen(false);
          fetchAppointments();
        }}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { fetchApi } from '../../services/api';

export default function DoctorHistory() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      const res = await fetchApi('/dashboard');
      setStats(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load history data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-on-surface-variant">Loading history...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-error bg-error-container rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-on-surface mb-2">Appointment History</h1>
          <p className="text-on-surface-variant">View all your past and completed appointments.</p>
        </div>
      </div>

      <div className="card overflow-hidden flex flex-col bg-white/80 backdrop-blur-md border border-outline-variant/30 rounded-xl shadow-sm">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left">
            <thead className="text-[12px] text-on-surface-variant border-b border-outline-variant/20 bg-surface-container-lowest">
              <tr>
                <th className="px-6 py-4 font-bold">Patient</th>
                <th className="px-6 py-4 font-bold">Date & Time</th>
                <th className="px-6 py-4 font-bold">Reason</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-sm">
              {stats?.appointmentHistory?.map((apt) => (
                <tr key={apt._id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
                        {apt.patientId?.firstName?.[0] || ''}{apt.patientId?.lastName?.[0] || ''}
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">{apt.patientId?.firstName} {apt.patientId?.lastName}</p>
                        <p className="text-[12px] text-on-surface-variant">ID: #{apt.patientId?.patientId || apt.patientId?._id?.slice(-4) || 'NEW'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-on-surface">
                    <div>{new Date(apt.appointmentDate).toLocaleDateString()}</div>
                    <div className="text-[12px] text-on-surface-variant mt-1">{apt.appointmentTime}</div>
                  </td>
                  <td className="px-6 py-4 text-on-surface">{apt.reason || 'Consultation'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-[12px] font-bold ${
                      apt.status === 'scheduled' ? 'bg-[#dcfce7] text-[#166534]' :
                      apt.status === 'completed' ? 'bg-[#dcfce7] text-[#166534]' :
                      apt.status === 'checked_in' ? 'bg-[#dbeafe] text-[#1e40af]' :
                      'bg-[#e2e8f0] text-[#475569]'
                    }`}>
                      {apt.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-on-surface-variant hover:text-primary transition-colors">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </td>
                </tr>
              ))}
              {!stats?.appointmentHistory?.length && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-on-surface-variant text-sm">No appointment history found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

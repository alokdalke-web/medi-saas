import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MedicalRecordForms({ isOpen, onClose, type, onSuccess }) {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Generic form state
  const [patientId, setPatientId] = useState('');
  
  // Note state
  const [noteContent, setNoteContent] = useState('');
  
  // Prescription state
  const [medication, setMedication] = useState('');
  const [dosage, setDosage] = useState('');
  const [duration, setDuration] = useState('');
  const [rxNotes, setRxNotes] = useState('');
  
  // Referral state
  const [specialty, setSpecialty] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchPatients();
    }
  }, [isOpen]);

  const fetchPatients = async () => {
    try {
      const res = await fetchApi('/patients');
      setPatients(res.data.patients || []);
    } catch (err) {
      console.error('Failed to load patients', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientId) {
      alert('Please select a patient');
      return;
    }

    setLoading(true);
    try {
      let content = {};
      if (type === 'note') {
        content = { text: noteContent };
      } else if (type === 'prescription') {
        content = { medication, dosage, duration, notes: rxNotes };
      } else if (type === 'referral') {
        content = { specialty, reason };
      }

      await fetchApi('/medical-records', {
        method: 'POST',
        body: JSON.stringify({
          patientId,
          doctorId: user?.id,
          recordType: type,
          content
        })
      });

      onSuccess();
      onClose();
      // Reset state
      setPatientId('');
      setNoteContent('');
      setMedication(''); setDosage(''); setDuration(''); setRxNotes('');
      setSpecialty(''); setReason('');
    } catch (err) {
      alert(err.message || 'Failed to save record');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const titles = {
    note: 'Add Clinical Note',
    prescription: 'New Prescription',
    referral: 'Create Referral'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-lowest">
          <h2 className="text-xl font-bold text-on-surface">{titles[type]}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="recordForm" onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-sm font-bold text-on-surface mb-1">Select Patient *</label>
              <select 
                value={patientId} 
                onChange={(e) => setPatientId(e.target.value)}
                required
                className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface"
              >
                <option value="">-- Choose Patient --</option>
                {patients.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.firstName} {p.lastName} (ID: {p.patientId})
                  </option>
                ))}
              </select>
            </div>

            {type === 'note' && (
              <div>
                <label className="block text-sm font-bold text-on-surface mb-1">Clinical Notes *</label>
                <textarea 
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  required
                  rows={6}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface resize-none"
                  placeholder="Enter observation, diagnosis, etc..."
                />
              </div>
            )}

            {type === 'prescription' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-1">Medication *</label>
                  <input 
                    type="text" 
                    value={medication}
                    onChange={(e) => setMedication(e.target.value)}
                    required
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface"
                    placeholder="e.g. Amoxicillin 500mg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-1">Dosage *</label>
                    <input 
                      type="text" 
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      required
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm"
                      placeholder="e.g. 1 pill twice a day"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-1">Duration *</label>
                    <input 
                      type="text" 
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      required
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm"
                      placeholder="e.g. 7 days"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-1">Additional Notes</label>
                  <textarea 
                    value={rxNotes}
                    onChange={(e) => setRxNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm resize-none"
                    placeholder="Take with food, etc..."
                  />
                </div>
              </>
            )}

            {type === 'referral' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-1">Referred To (Specialty) *</label>
                  <input 
                    type="text" 
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    required
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface"
                    placeholder="e.g. Cardiology"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-1">Reason for Referral *</label>
                  <textarea 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    rows={4}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface resize-none"
                    placeholder="Describe symptoms, test results, etc..."
                  />
                </div>
              </>
            )}
          </form>
        </div>

        <div className="px-6 py-4 border-t border-outline-variant/20 bg-surface-container-lowest flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg font-bold text-on-surface hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="recordForm"
            disabled={loading}
            className="px-6 py-2.5 rounded-lg font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            {loading ? <span className="material-symbols-outlined animate-spin">sync</span> : null}
            Save {titles[type]?.split(' ')[1]}
          </button>
        </div>
      </div>
    </div>
  );
}

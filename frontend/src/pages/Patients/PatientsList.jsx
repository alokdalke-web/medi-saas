import { useState, useEffect } from "react";
import { fetchApi } from "../../services/api";
import PatientFormDialog from "./PatientFormDialog";

export default function PatientsList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const loadPatients = async (searchQuery = "") => {
    try {
      setLoading(true);
      const url = searchQuery ? `/patients?search=${encodeURIComponent(searchQuery)}` : '/patients';
      const res = await fetchApi(url);
      setPatients(res.data.patients);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadPatients(search);
    }, 500);

    const handleSync = (e) => {
      if (e.detail?.entityType === 'patients') {
        loadPatients(search);
      }
    };
    window.addEventListener('p2p-sync-update', handleSync);

    return () => {
      clearTimeout(delayDebounceFn);
      window.removeEventListener('p2p-sync-update', handleSync);
    };
  }, [search]);

  const handleAddPatient = () => {
    setSelectedPatient(null);
    setIsDialogOpen(true);
  };

  const handleEditPatient = (patient) => {
    setSelectedPatient(patient);
    setIsDialogOpen(true);
  };

  const handleDeletePatient = async (id) => {
    if (confirm('Are you sure you want to delete this patient?')) {
      try {
        await fetchApi(`/patients/${id}`, { method: 'DELETE' });
        loadPatients(search);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Patients</h1>
        <button 
          onClick={handleAddPatient}
          className="md:flex hidden bg-gradient-to-br from-[#10b981] to-[#006c49] text-white px-6 py-2 rounded-full text-xs font-semibold tracking-wide items-center gap-2 shadow-sm active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Add Patient
        </button>
      </div>

      {/* Quick Stats Bento Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow group bg-white/80 backdrop-blur-md border border-outline-variant/80">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary-container/10 rounded-lg text-primary">
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>groups</span>
            </div>
          </div>
          <p className="text-on-surface-variant text-xs font-semibold tracking-wide uppercase">Total Patients</p>
          <h2 className="text-3xl font-bold mt-1">{patients.length || "0"}</h2>
        </div>
        <div className="card p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white/80 backdrop-blur-md border border-outline-variant/80">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary-container/10 rounded-lg text-secondary">
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>person_add</span>
            </div>
          </div>
          <p className="text-on-surface-variant text-xs font-semibold tracking-wide uppercase">New This Week</p>
          <h2 className="text-3xl font-bold mt-1">0</h2>
        </div>
        <div onClick={handleAddPatient} className="card p-6 rounded-xl shadow-sm md:col-span-1 bg-surface-container-lowest border-dashed border-2 border-outline-variant/50 flex flex-col items-center justify-center gap-2 group cursor-pointer hover:bg-surface-container-low transition-colors">
          <div className="w-12 h-12 rounded-full bg-outline-variant/20 flex items-center justify-center text-outline group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">analytics</span>
          </div>
          <p className="text-on-surface-variant text-xs font-semibold tracking-wide">View Analytics Report</p>
        </div>
      </section>

      {/* Search and Filter Bar */}
      <section className="flex flex-col md:flex-row gap-4 items-center sticky top-16 py-4 bg-surface/95 backdrop-blur-sm z-30">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input 
            className="w-full pl-[48px] pr-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-surface-container-lowest" 
            placeholder="Search by name, ID, or phone" 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low transition-colors w-full md:w-auto">
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
            <span className="text-xs font-semibold tracking-wide">Filter</span>
          </button>
          <button 
            onClick={handleAddPatient}
            className="md:hidden flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold shadow-lg w-full"
          >
            <span className="material-symbols-outlined">person_add</span>
            <span className="text-xs font-semibold tracking-wide">Add</span>
          </button>
        </div>
      </section>

      {/* Patient List */}
      <section className="space-y-4">
        <div className="hidden md:grid grid-cols-12 px-6 py-2 text-on-surface-variant text-xs font-semibold tracking-widest uppercase">
          <div className="col-span-4">Patient Information</div>
          <div className="col-span-2">Patient ID</div>
          <div className="col-span-2">Age / Gender</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-on-surface-variant">Loading patients...</div>
        ) : patients.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant">No patients found.</div>
        ) : (
          patients.map((pat) => (
            <div key={pat._id} className="card rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all group cursor-pointer bg-white/80 backdrop-blur-md border border-outline-variant/80">
              <div className="flex flex-col md:grid md:grid-cols-12 md:items-center p-4 md:p-6 gap-4">
                
                <div className="col-span-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-container/20 flex items-center justify-center bg-surface-container-high text-on-surface-variant font-bold">
                    {pat.firstName?.[0]}{pat.lastName?.[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-on-surface">{pat.firstName} {pat.lastName}</h3>
                    <p className="text-sm text-on-surface-variant">Phone: {pat.phone}</p>
                  </div>
                </div>

                <div className="col-span-2">
                  <span className="text-[13px] font-mono px-2 py-1 bg-surface-container rounded-md text-on-surface-variant">#{pat.patientId || pat._id.slice(-6).toUpperCase()}</span>
                </div>

                <div className="col-span-2">
                  <span className="text-sm text-on-surface font-semibold">
                    {pat.dateOfBirth ? Math.floor((new Date() - new Date(pat.dateOfBirth)) / 31557600000) : '--'}, {pat.gender ? pat.gender.charAt(0).toUpperCase() : '-'}
                  </span>
                </div>

                <div className="col-span-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-container/20 text-on-primary-container text-[11px] font-semibold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2 animate-pulse"></span>
                    Active
                  </span>
                </div>

                <div className="col-span-2 flex justify-end gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleEditPatient(pat); }}
                    className="p-2 rounded-lg hover:bg-primary-container/10 text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeletePatient(pat._id); }}
                    className="p-2 rounded-lg hover:bg-error-container/50 text-error transition-colors"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      <PatientFormDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        patient={selectedPatient}
        onSuccess={() => loadPatients(search)}
      />
    </div>
  );
}

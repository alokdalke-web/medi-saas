import { useState, useEffect } from "react";
import { fetchApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import DoctorFormDialog from "./DoctorFormDialog";

export default function DoctorsList() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const loadDoctors = async (searchQuery = "") => {
    try {
      setLoading(true);
      // If the backend doesn't support search yet, we can filter locally, but let's pass it anyway
      const url = searchQuery ? `/doctors?search=${encodeURIComponent(searchQuery)}` : '/doctors';
      const res = await fetchApi(url);
      setDoctors(res.data.doctors);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadDoctors(search);
    }, 500);

    const handleSync = (e) => {
      if (e.detail?.entityType === 'doctors') {
        loadDoctors(search);
      }
    };
    window.addEventListener('p2p-sync-update', handleSync);

    return () => {
      clearTimeout(delayDebounceFn);
      window.removeEventListener('p2p-sync-update', handleSync);
    };
  }, [search]);

  const handleAddDoctor = () => {
    setSelectedDoctor(null);
    setIsDialogOpen(true);
  };

  const handleEditDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setIsDialogOpen(true);
  };

  const handleDeleteDoctor = async (id) => {
    if (confirm('Are you sure you want to permanently delete this doctor and all their appointments?')) {
      try {
        await fetchApi(`/doctors/${id}`, { method: 'DELETE' });
        loadDoctors(search);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const activeDoctorsCount = doctors.filter(d => d.isActive).length;

  return (
    <div className="max-w-[1440px] mx-auto space-y-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Doctors</h1>
        {user?.role === 'clinic_admin' && (
          <button 
            onClick={handleAddDoctor}
            className="md:flex hidden bg-gradient-to-br from-[#10b981] to-[#006c49] text-white px-6 py-2 rounded-full text-xs font-semibold tracking-wide items-center gap-2 shadow-sm active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Add Doctor
          </button>
        )}
      </div>

      {/* Quick Stats Bento Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow group bg-white/80 backdrop-blur-md border border-outline-variant/80">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary-container/10 rounded-lg text-primary">
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>stethoscope</span>
            </div>
          </div>
          <p className="text-on-surface-variant text-xs font-semibold tracking-wide uppercase">Total Doctors</p>
          <h2 className="text-3xl font-bold mt-1">{doctors.length || "0"}</h2>
        </div>
        <div className="card p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white/80 backdrop-blur-md border border-outline-variant/80">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary-container/10 rounded-lg text-secondary">
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
            </div>
          </div>
          <p className="text-on-surface-variant text-xs font-semibold tracking-wide uppercase">Active Doctors</p>
          <h2 className="text-3xl font-bold mt-1">{activeDoctorsCount}</h2>
        </div>
        <div className="card p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white/80 backdrop-blur-md border border-outline-variant/80">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-tertiary-container/10 rounded-lg text-tertiary">
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>event_available</span>
            </div>
          </div>
          <p className="text-on-surface-variant text-xs font-semibold tracking-wide uppercase">Available Today</p>
          <h2 className="text-3xl font-bold mt-1">0</h2>
        </div>
      </section>

      {/* Search and Filter Bar */}
      <section className="flex flex-col md:flex-row gap-4 items-center sticky top-16 py-4 bg-surface/95 backdrop-blur-sm z-30">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input 
            className="w-full pl-[48px] pr-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-surface-container-lowest" 
            placeholder="Search by name, specialty, or code" 
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
          {user?.role === 'clinic_admin' && (
            <button 
              onClick={handleAddDoctor}
              className="md:hidden flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold shadow-lg w-full"
            >
              <span className="material-symbols-outlined">person_add</span>
              <span className="text-xs font-semibold tracking-wide">Add</span>
            </button>
          )}
        </div>
      </section>

      {/* Doctor List */}
      <section className="space-y-4">
        <div className="hidden md:grid grid-cols-12 px-6 py-2 text-on-surface-variant text-xs font-semibold tracking-widest uppercase">
          <div className="col-span-4">Doctor Information</div>
          <div className="col-span-2">Doctor Code</div>
          <div className="col-span-2">Experience</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-on-surface-variant">Loading doctors...</div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant">No doctors found.</div>
        ) : (
          // Local filter fallback if search API is not implemented
          doctors.filter(d => 
            d.name?.toLowerCase().includes(search.toLowerCase()) || 
            d.specialization?.toLowerCase().includes(search.toLowerCase()) ||
            d.doctorCode?.toLowerCase().includes(search.toLowerCase())
          ).map((doc) => (
            <div key={doc._id} className="card rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all group cursor-pointer bg-white/80 backdrop-blur-md border border-outline-variant/80">
              <div className="flex flex-col md:grid md:grid-cols-12 md:items-center p-4 md:p-6 gap-4">
                
                <div className="col-span-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-container/20 flex items-center justify-center bg-surface-container-high text-on-surface-variant font-bold">
                    {doc.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR'}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-on-surface">{doc.name}</h3>
                    <p className="text-sm text-on-surface-variant">{doc.specialization}</p>
                  </div>
                </div>

                <div className="col-span-2">
                  <span className="text-[13px] font-mono px-2 py-1 bg-surface-container rounded-md text-on-surface-variant">
                    {doc.doctorCode || doc._id.slice(-6).toUpperCase()}
                  </span>
                </div>

                <div className="col-span-2">
                  <span className="text-sm text-on-surface font-semibold">
                    {doc.experience ? `${doc.experience} Years` : '--'}
                  </span>
                </div>

                <div className="col-span-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                    doc.isActive 
                      ? 'bg-primary-container/20 text-on-primary-container' 
                      : 'bg-error-container/20 text-error'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-2 ${doc.isActive ? 'bg-primary animate-pulse' : 'bg-error'}`}></span>
                    {doc.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="col-span-2 flex justify-end gap-2">
                  {user?.role === 'clinic_admin' && (
                    <>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEditDoctor(doc); }}
                        className="p-2 rounded-lg hover:bg-primary-container/10 text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteDoctor(doc._id); }}
                        className="p-2 rounded-lg hover:bg-error-container/50 text-error transition-colors"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      <DoctorFormDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        doctor={selectedDoctor}
        onSuccess={() => loadDoctors(search)}
      />
    </div>
  );
}

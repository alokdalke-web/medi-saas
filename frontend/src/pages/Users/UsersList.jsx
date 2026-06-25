import { useState, useEffect } from "react";
import { fetchApi } from "../../services/api";
import UserFormDialog from "./UserFormDialog";

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const loadUsers = async (searchQuery = "") => {
    try {
      setLoading(true);
      const url = searchQuery ? `/users?search=${encodeURIComponent(searchQuery)}` : '/users';
      const res = await fetchApi(url);
      setUsers(res.data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadUsers(search);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsDialogOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleDeleteUser = async (id) => {
    if (confirm('Are you sure you want to deactivate this user?')) {
      try {
        await fetchApi(`/users/${id}`, { method: 'DELETE' });
        loadUsers(search);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const activeUsersCount = users.filter(u => u.isActive).length;

  return (
    <div className="max-w-[1440px] mx-auto space-y-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Staff Members</h1>
        <button 
          onClick={handleAddUser}
          className="md:flex hidden bg-gradient-to-br from-[#10b981] to-[#006c49] text-white px-6 py-2 rounded-full text-xs font-semibold tracking-wide items-center gap-2 shadow-sm active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Add Staff
        </button>
      </div>

      {/* Quick Stats Bento Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow group bg-white/80 backdrop-blur-md border border-outline-variant/80">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary-container/10 rounded-lg text-primary">
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>badge</span>
            </div>
            <span className="text-primary font-bold text-[14px]">Total</span>
          </div>
          <p className="text-on-surface-variant text-xs font-semibold tracking-wide uppercase">Total Staff</p>
          <h2 className="text-3xl font-bold mt-1">{users.length || "0"}</h2>
        </div>
        <div className="card p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white/80 backdrop-blur-md border border-outline-variant/80">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary-container/10 rounded-lg text-secondary">
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>how_to_reg</span>
            </div>
            <span className="text-secondary font-bold text-[14px]">{activeUsersCount} Active</span>
          </div>
          <p className="text-on-surface-variant text-xs font-semibold tracking-wide uppercase">Active Members</p>
          <h2 className="text-3xl font-bold mt-1">{activeUsersCount}</h2>
        </div>
        <div className="card p-6 rounded-xl shadow-sm md:col-span-1 bg-surface-container-lowest border-dashed border-2 border-outline-variant/50 flex flex-col items-center justify-center gap-2 group cursor-pointer hover:bg-surface-container-low transition-colors">
          <div className="w-12 h-12 rounded-full bg-outline-variant/20 flex items-center justify-center text-outline group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">shield_person</span>
          </div>
          <p className="text-on-surface-variant text-xs font-semibold tracking-wide">Manage Roles & Permissions</p>
        </div>
      </section>

      {/* Search and Filter Bar */}
      <section className="flex flex-col md:flex-row gap-4 items-center sticky top-16 py-4 bg-surface/95 backdrop-blur-sm z-30">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input 
            className="w-full pl-[48px] pr-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-surface-container-lowest" 
            placeholder="Search by name, email, or role" 
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
            onClick={handleAddUser}
            className="md:hidden flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold shadow-lg w-full"
          >
            <span className="material-symbols-outlined">person_add</span>
            <span className="text-xs font-semibold tracking-wide">Add</span>
          </button>
        </div>
      </section>

      {/* Staff List */}
      <section className="space-y-4">
        <div className="hidden md:grid grid-cols-12 px-6 py-2 text-on-surface-variant text-xs font-semibold tracking-widest uppercase">
          <div className="col-span-4">Staff Information</div>
          <div className="col-span-4">Email Contact</div>
          <div className="col-span-2">Role / Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-on-surface-variant">Loading staff members...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant">No staff found.</div>
        ) : (
          // Local filter fallback if search API is not implemented
          users.filter(u => 
            u.name?.toLowerCase().includes(search.toLowerCase()) || 
            u.email?.toLowerCase().includes(search.toLowerCase()) ||
            u.role?.toLowerCase().includes(search.toLowerCase())
          ).map((user) => (
            <div key={user._id} className="card rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all group cursor-pointer bg-white/80 backdrop-blur-md border border-outline-variant/80">
              <div className="flex flex-col md:grid md:grid-cols-12 md:items-center p-4 md:p-6 gap-4">
                
                <div className="col-span-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-container/20 flex items-center justify-center bg-surface-container-high text-on-surface-variant font-bold">
                    {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST'}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-on-surface">{user.name}</h3>
                  </div>
                </div>

                <div className="col-span-4">
                  <span className="text-sm text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">mail</span>
                    {user.email}
                  </span>
                </div>

                <div className="col-span-2 flex flex-col items-start gap-1">
                  <span className="text-[13px] font-mono px-2 py-1 bg-surface-container rounded-md text-on-surface-variant capitalize">
                    {user.role.replace('_', ' ')}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider mt-1 ${
                    user.isActive 
                      ? 'bg-primary-container/20 text-on-primary-container' 
                      : 'bg-error-container/20 text-error'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-2 ${user.isActive ? 'bg-primary animate-pulse' : 'bg-error'}`}></span>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="col-span-2 flex justify-end gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleEditUser(user); }}
                    className="p-2 rounded-lg hover:bg-primary-container/10 text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteUser(user._id); }}
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

      <UserFormDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        user={selectedUser}
        onSuccess={() => loadUsers(search)}
      />
    </div>
  );
}

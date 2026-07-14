import { useState, useEffect } from "react";
import { fetchApi } from "../../services/api";
import BillingFormDialog from "./BillingFormDialog";
import InvoiceSlipDialog from "./InvoiceSlipDialog";

export default function BillingList() {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSlipOpen, setIsSlipOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState(null);

  const loadBillings = async (searchQuery = "") => {
    try {
      setLoading(true);
      const url = searchQuery ? `/billing?search=${encodeURIComponent(searchQuery)}` : '/billing';
      const res = await fetchApi(url);
      setBillings(res.data.billings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadBillings(search);
    }, 500);

    const handleSync = (e) => {
      if (e.detail?.entityType === 'billing') {
        loadBillings(search);
      }
    };
    window.addEventListener('p2p-sync-update', handleSync);

    return () => {
      clearTimeout(delayDebounceFn);
      window.removeEventListener('p2p-sync-update', handleSync);
    };
  }, [search]);

  const handleAddBilling = () => {
    setSelectedBilling(null);
    setIsDialogOpen(true);
  };

  const handleEditBilling = (billing) => {
    setSelectedBilling(billing);
    setIsDialogOpen(true);
  };

  const handlePrintBilling = (billing) => {
    setSelectedBilling(billing);
    setIsSlipOpen(true);
  };

  const handleDeleteBilling = async (id) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        await fetchApi(`/billing/${id}`, { method: 'DELETE' });
        loadBillings(search);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-primary-container text-primary';
      case 'cancelled': return 'bg-error-container text-error';
      default: return 'bg-secondary-container text-secondary';
    }
  };

  const totalRevenue = billings.filter(b => b.status === 'paid').reduce((sum, b) => sum + (b.amount || 0), 0);
  const pendingAmount = billings.filter(b => b.status === 'pending').reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <div className="max-w-[1440px] mx-auto space-y-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Billing & Payments</h1>
        <button 
          onClick={handleAddBilling}
          className="md:flex hidden bg-gradient-to-br from-[#10b981] to-[#006c49] text-white px-6 py-2 rounded-full text-xs font-semibold tracking-wide items-center gap-2 shadow-sm active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
          Create Invoice
        </button>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6 rounded-xl shadow-sm bg-white/80 backdrop-blur-md border border-outline-variant/80">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary-container/10 rounded-lg text-primary">
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>payments</span>
            </div>
          </div>
          <p className="text-on-surface-variant text-xs font-semibold tracking-wide uppercase">Collected Revenue</p>
          <h2 className="text-3xl font-bold mt-1">${totalRevenue.toFixed(2)}</h2>
        </div>
        <div className="card p-6 rounded-xl shadow-sm bg-white/80 backdrop-blur-md border border-outline-variant/80">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary-container/10 rounded-lg text-secondary">
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>pending_actions</span>
            </div>
          </div>
          <p className="text-on-surface-variant text-xs font-semibold tracking-wide uppercase">Pending Payments</p>
          <h2 className="text-3xl font-bold mt-1">${pendingAmount.toFixed(2)}</h2>
        </div>
        <div onClick={handleAddBilling} className="card p-6 rounded-xl shadow-sm md:col-span-1 bg-surface-container-lowest border-dashed border-2 border-outline-variant/50 flex flex-col items-center justify-center gap-2 group cursor-pointer hover:bg-surface-container-low transition-colors">
          <div className="w-12 h-12 rounded-full bg-outline-variant/20 flex items-center justify-center text-outline group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">add</span>
          </div>
          <p className="text-sm font-semibold text-on-surface-variant group-hover:text-primary transition-colors">New Invoice</p>
        </div>
      </section>

      <section className="card bg-surface-container-lowest border border-outline-variant/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-outline-variant/50 bg-surface/50 backdrop-blur-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant">search</span>
            <input 
              type="text" 
              placeholder="Search invoices..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface rounded-full border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-on-surface-variant flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span>
              Loading invoices...
            </div>
          ) : billings.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-on-surface-variant">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl">receipt_long</span>
              </div>
              <h3 className="text-lg font-semibold text-on-surface mb-1">No Invoices Found</h3>
              <p className="text-sm">Create your first invoice to get started.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50 text-on-surface-variant text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold rounded-tl-xl">Invoice ID</th>
                  <th className="p-4 font-semibold">Patient</th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Amount</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right rounded-tr-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {billings.map((billing) => (
                  <tr key={billing._id} className="hover:bg-surface-container-low/30 transition-colors group">
                    <td className="p-4">
                      <p className="font-semibold text-on-surface">{billing.billingId}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-on-surface">
                        {billing.patientId?.firstName} {billing.patientId?.lastName}
                      </p>
                      <p className="text-xs text-on-surface-variant">{billing.patientId?.patientId}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-on-surface">
                        {new Date(billing.issuedDate).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-on-surface">${Number(billing.amount).toFixed(2)}</p>
                      <p className="text-xs text-on-surface-variant">{billing.paymentMethod}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(billing.status)}`}>
                        {billing.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handlePrintBilling(billing)} className="p-2 bg-surface-container-low hover:bg-primary-container hover:text-primary rounded-lg text-on-surface-variant transition-colors" title="Download/Print Invoice">
                          <span className="material-symbols-outlined text-[20px]">download</span>
                        </button>
                        <button onClick={() => handleEditBilling(billing)} className="p-2 bg-surface-container-low hover:bg-secondary-container hover:text-secondary rounded-lg text-on-surface-variant transition-colors">
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button onClick={() => handleDeleteBilling(billing._id)} className="p-2 bg-surface-container-low hover:bg-error-container hover:text-error rounded-lg text-on-surface-variant transition-colors">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <BillingFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={() => {
          setIsDialogOpen(false);
          loadBillings(search);
        }}
        billing={selectedBilling}
      />

      <InvoiceSlipDialog
        isOpen={isSlipOpen}
        onClose={() => setIsSlipOpen(false)}
        billing={selectedBilling}
      />
    </div>
  );
}

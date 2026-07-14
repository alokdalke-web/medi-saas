import { useState, useEffect } from "react";
import { fetchApi } from "../../services/api";

export default function BillingFormDialog({ isOpen, onClose, onSave, billing }) {
  const [formData, setFormData] = useState({
    patientId: "",
    appointmentId: "",
    amount: "",
    status: "pending",
    paymentMethod: "Cash",
    dueDate: "",
    notes: ""
  });
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadPatients();
      if (billing) {
        setFormData({
          patientId: billing.patientId?._id || billing.patientId || "",
          appointmentId: billing.appointmentId?._id || billing.appointmentId || "",
          amount: billing.amount || "",
          status: billing.status || "pending",
          paymentMethod: billing.paymentMethod || "Cash",
          dueDate: billing.dueDate ? new Date(billing.dueDate).toISOString().slice(0, 10) : "",
          notes: billing.notes || ""
        });
        if (billing.patientId) {
          loadAppointments(billing.patientId?._id || billing.patientId);
        }
      } else {
        setFormData({
          patientId: "",
          appointmentId: "",
          amount: "",
          status: "pending",
          paymentMethod: "Cash",
          dueDate: "",
          notes: ""
        });
      }
      setError("");
    }
  }, [isOpen, billing]);

  const loadPatients = async () => {
    try {
      const res = await fetchApi('/patients');
      setPatients(res.data.patients || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAppointments = async (patientId) => {
    try {
      const res = await fetchApi(`/appointments?patientId=${patientId}`);
      setAppointments(res.data.appointments || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (name === "patientId") {
      setFormData(prev => ({ ...prev, appointmentId: "" }));
      loadAppointments(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = { ...formData };
      if (!payload.appointmentId) delete payload.appointmentId;
      if (payload.dueDate) payload.dueDate = new Date(payload.dueDate).toISOString();

      if (billing) {
        await fetchApi(`/billing/${billing._id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi("/billing", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      onSave();
    } catch (err) {
      setError(err.message || "Failed to save invoice");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest">
          <h2 className="text-xl font-bold text-on-surface">
            {billing ? "Edit Invoice" : "Create Invoice"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-error-container/30 text-error rounded-xl border border-error/20 flex gap-2 items-center text-sm font-medium">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}
          
          <form id="billingForm" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Patient *</label>
              <select
                name="patientId"
                value={formData.patientId}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-on-surface"
              >
                <option value="">Select a patient</option>
                {patients.map(p => (
                  <option key={p._id} value={p._id}>{p.firstName} {p.lastName} - {p.patientCode || p.patientId}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Appointment (Optional)</label>
              <select
                name="appointmentId"
                value={formData.appointmentId}
                onChange={handleChange}
                disabled={!formData.patientId}
                className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-on-surface disabled:opacity-50"
              >
                <option value="">Select an appointment</option>
                {appointments.map(a => (
                  <option key={a._id} value={a._id}>
                    {a.appointmentDate ? new Date(a.appointmentDate).toLocaleDateString() : ''} at {a.appointmentTime}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-on-surface-variant">$</span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-on-surface"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-on-surface"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-on-surface"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Payment Method</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-on-surface"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-on-surface resize-none"
                placeholder="Add any billing notes..."
              ></textarea>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 bg-surface-container-lowest border-t border-outline-variant/30 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="billingForm"
            disabled={loading}
            className="px-5 py-2 rounded-full font-medium bg-primary text-on-primary hover:bg-primary/90 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : null}
            {billing ? "Update Invoice" : "Create Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}

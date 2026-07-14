import { useRef } from "react";

export default function InvoiceSlipDialog({ isOpen, onClose, billing }) {
  const invoiceRef = useRef();

  if (!isOpen || !billing) return null;

  const handlePrint = () => {
    const printContent = invoiceRef.current;
    const originalContent = document.body.innerHTML;
    
    // Quick hack for printing: replace body with invoice, print, restore.
    // In React, it's safer to use a hidden iframe or just print the current window
    // with CSS media queries. We'll add a 'print-only' class structure.
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Hide this container when printing, but we will use a global print CSS hack in index.css */}
      <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] no-print">
        <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest">
          <h2 className="text-xl font-bold text-on-surface">Invoice Slip</h2>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-full hover:bg-primary/90 transition-colors text-sm font-semibold">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Download / Print
            </button>
            <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* The actual invoice slip */}
        <div className="p-8 overflow-y-auto bg-white text-black print-container" ref={invoiceRef} id="invoice-slip">
          <div className="flex justify-between items-start border-b-2 border-gray-200 pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 tracking-tight">INVOICE</h1>
              <p className="text-gray-500 mt-1 font-medium">{billing.billingId}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-gray-800">Medi-SaaS Clinic</h2>
              <p className="text-sm text-gray-500 mt-1">123 Health Avenue, Medical District</p>
              <p className="text-sm text-gray-500">contact@medisaas.com | +1 (555) 123-4567</p>
            </div>
          </div>

          <div className="flex justify-between mb-8">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Billed To</p>
              <h3 className="text-lg font-bold text-gray-800">{billing.patientId?.firstName} {billing.patientId?.lastName}</h3>
              <p className="text-sm text-gray-500 mt-1">Patient ID: {billing.patientId?.patientId || billing.patientId?.patientCode || 'N/A'}</p>
              {billing.patientId?.phone && <p className="text-sm text-gray-500">Phone: {billing.patientId.phone}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Invoice Details</p>
              <p className="text-sm text-gray-800"><span className="font-semibold text-gray-500 mr-2">Issued:</span> {new Date(billing.issuedDate).toLocaleDateString()}</p>
              {billing.dueDate && (
                <p className="text-sm text-gray-800 mt-1"><span className="font-semibold text-gray-500 mr-2">Due Date:</span> {new Date(billing.dueDate).toLocaleDateString()}</p>
              )}
              <p className="text-sm text-gray-800 mt-1"><span className="font-semibold text-gray-500 mr-2">Status:</span> 
                <span className="uppercase ml-1 font-bold">
                  {billing.status}
                </span>
              </p>
            </div>
          </div>

          <table className="w-full text-left border-collapse mb-8">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                <th className="p-3 font-bold rounded-tl-lg">Description</th>
                <th className="p-3 font-bold text-right">Qty</th>
                <th className="p-3 font-bold text-right rounded-tr-lg">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="p-4">
                  <p className="font-semibold text-gray-800">Medical Services / Consultation</p>
                  {billing.appointmentId && (
                    <p className="text-sm text-gray-500 mt-1">
                      Ref: Appointment on {new Date(billing.appointmentId.appointmentDate).toLocaleDateString()} at {billing.appointmentId.appointmentTime}
                    </p>
                  )}
                  {billing.notes && (
                    <p className="text-sm text-gray-500 mt-1">Notes: {billing.notes}</p>
                  )}
                </td>
                <td className="p-4 text-right text-gray-800 font-medium">1</td>
                <td className="p-4 text-right text-gray-800 font-bold">${Number(billing.amount).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="flex justify-between py-2 text-sm text-gray-600">
                <span>Subtotal</span>
                <span>${Number(billing.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm text-gray-600">
                <span>Tax (0%)</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-gray-800 text-lg font-bold text-gray-800 mt-2">
                <span>Total</span>
                <span>${Number(billing.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm text-gray-500 mt-2">
                <span>Payment Method</span>
                <span className="font-medium text-gray-700">{billing.paymentMethod}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 text-center">
            <p className="text-sm font-medium text-gray-800">Thank you for choosing Medi-SaaS Clinic.</p>
            <p className="text-xs text-gray-500 mt-1">If you have any questions regarding this invoice, please contact us.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

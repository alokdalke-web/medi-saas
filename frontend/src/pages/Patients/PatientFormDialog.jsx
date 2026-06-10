import { useState, useEffect } from "react";
import { fetchApi } from "../../services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PatientFormDialog({ open, onOpenChange, patient, onSuccess }) {
  const isEditing = !!patient;
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male',
    dateOfBirth: '',
    phone: '',
    email: '',
    bloodGroup: '',
    address: { street: '', city: '', state: '', country: '', pincode: '' },
    emergencyContact: { name: '', phone: '', relationship: '' }
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        gender: patient.gender || 'Male',
        dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split('T')[0] : '',
        phone: patient.phone || '',
        email: patient.email || '',
        bloodGroup: patient.bloodGroup || '',
        address: patient.address || { street: '', city: '', state: '', country: '', pincode: '' },
        emergencyContact: patient.emergencyContact || { name: '', phone: '', relationship: '' }
      });
    } else {
      setFormData({
        firstName: '', lastName: '', gender: 'Male', dateOfBirth: '', phone: '', email: '', bloodGroup: '',
        address: { street: '', city: '', state: '', country: '', pincode: '' },
        emergencyContact: { name: '', phone: '', relationship: '' }
      });
    }
    setError('');
  }, [patient, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (isEditing) {
        await fetchApi(`/patients/${patient._id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        await fetchApi('/patients', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Patient' : 'Register New Patient'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update patient details below.' : 'Enter new patient demographics and details.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {error && <div className="text-sm text-red-500">{error}</div>}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select 
                  id="gender" name="gender" 
                  value={formData.gender} 
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input id="dateOfBirth" type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Input id="bloodGroup" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" name="email" value={formData.email} onChange={handleChange} />
              </div>
            </div>

            <h3 className="text-md font-semibold mt-4">Address</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="address.street">Street Address</Label>
                <Input id="address.street" name="address.street" value={formData.address.street} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address.city">City</Label>
                <Input id="address.city" name="address.city" value={formData.address.city} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address.state">State</Label>
                <Input id="address.state" name="address.state" value={formData.address.state} onChange={handleChange} />
              </div>
            </div>

            <h3 className="text-md font-semibold mt-4">Emergency Contact</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContact.name">Name</Label>
                <Input id="emergencyContact.name" name="emergencyContact.name" value={formData.emergencyContact.name} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContact.phone">Phone</Label>
                <Input id="emergencyContact.phone" name="emergencyContact.phone" value={formData.emergencyContact.phone} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContact.relationship">Relationship</Label>
                <Input id="emergencyContact.relationship" name="emergencyContact.relationship" value={formData.emergencyContact.relationship} onChange={handleChange} />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Patient'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

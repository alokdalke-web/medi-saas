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

export default function DoctorFormDialog({ open, onOpenChange, doctor, onSuccess }) {
  const isEditing = !!doctor;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialization: '',
    qualification: '',
    experience: 0,
    startTime: '09:00',
    endTime: '18:00',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (doctor) {
      setFormData({
        name: doctor.name || '',
        email: doctor.email || '',
        phone: doctor.phone || '',
        specialization: doctor.specialization || '',
        qualification: doctor.qualification || '',
        experience: doctor.experience || 0,
        startTime: doctor.availability?.startTime || '09:00',
        endTime: doctor.availability?.endTime || '18:00',
        password: '' // Don't populate
      });
    } else {
      setFormData({
        name: '', email: '', password: '', phone: '', specialization: '',
        qualification: '', experience: 0, startTime: '09:00', endTime: '18:00'
      });
    }
    setError('');
  }, [doctor, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      name: formData.name,
      phone: formData.phone,
      specialization: formData.specialization,
      qualification: formData.qualification,
      experience: Number(formData.experience),
      availability: {
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        startTime: formData.startTime,
        endTime: formData.endTime
      }
    };

    try {
      if (isEditing) {
        await fetchApi(`/doctors/${doctor._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi('/doctors', {
          method: 'POST',
          body: JSON.stringify({ ...payload, email: formData.email, password: formData.password }),
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Doctor' : 'Add New Doctor'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update doctor profile and availability.' : 'Register a new doctor for this clinic.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {error && <div className="text-sm text-red-500">{error}</div>}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
              </div>
            </div>

            {!isEditing && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Login Email</Label>
                  <Input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Login Password</Label>
                  <Input id="password" type="password" name="password" value={formData.password} onChange={handleChange} required />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input id="specialization" name="specialization" value={formData.specialization} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qualification">Qualification (e.g. MBBS, MD)</Label>
                <Input id="qualification" name="qualification" value={formData.qualification} onChange={handleChange} required />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experience">Experience (Years)</Label>
                <Input id="experience" type="number" name="experience" value={formData.experience} onChange={handleChange} required min="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input id="startTime" type="time" name="startTime" value={formData.startTime} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input id="endTime" type="time" name="endTime" value={formData.endTime} onChange={handleChange} required />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

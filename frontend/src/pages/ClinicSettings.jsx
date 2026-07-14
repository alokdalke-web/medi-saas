import { useState, useEffect } from "react";
import { fetchApi } from "../services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClinicSettings() {
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const loadClinic = async () => {
      try {
        const res = await fetchApi('/clinics/my-clinic');
        setClinic(res.data.clinic);
      } catch (err) {
        setMessage({ text: err.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    loadClinic();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetchApi('/clinics/my-clinic', {
        method: 'PUT',
        body: JSON.stringify(clinic),
      });
      setClinic(res.data.clinic);
      setMessage({ text: 'Clinic settings updated successfully!', type: 'success' });
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
      setIsEditing(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setClinic(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setClinic(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setClinic(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <div>Loading clinic details...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Clinic Settings</CardTitle>
            <CardDescription>Manage your clinic information and address</CardDescription>
          </div>
          {!isEditing && (
            <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </Button>
          )}
        </CardHeader>
        
        {message.text && (
          <div className={`mx-6 mb-4 p-3 text-sm rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        {!isEditing ? (
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-lg bg-surface-container flex items-center justify-center overflow-hidden border border-outline-variant/30">
                {clinic?.logo ? (
                  <img src={clinic.logo} alt="Clinic Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/50">local_hospital</span>
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-on-surface">{clinic?.name || 'Unnamed Clinic'}</h3>
                <p className="text-on-surface-variant flex items-center gap-2 mt-1">
                  <span className="material-symbols-outlined text-[18px]">phone</span> {clinic?.phone || 'No phone'}
                </p>
                <p className="text-on-surface-variant flex items-center gap-2 mt-1">
                  <span className="material-symbols-outlined text-[18px]">email</span> {clinic?.email || 'No email'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant/30">
              <h4 className="text-sm font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Address</h4>
              <p className="text-on-surface">
                {clinic?.address?.street ? `${clinic.address.street}, ` : ''}
                {clinic?.address?.city ? `${clinic.address.city}, ` : ''}
                {clinic?.address?.state ? `${clinic.address.state} ` : ''}
                {clinic?.address?.country ? clinic.address.country : 'No address provided'}
              </p>
            </div>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logo">Clinic Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-surface-container flex items-center justify-center overflow-hidden border border-outline-variant/30 shrink-0">
                    {clinic?.logo ? (
                      <img src={clinic.logo} alt="Logo preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-2xl text-on-surface-variant/50">image</span>
                    )}
                  </div>
                  <Input id="logo" type="file" accept="image/*" onChange={handleLogoChange} className="cursor-pointer" />
                </div>
              </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Clinic Name</Label>
                <Input id="name" name="name" value={clinic?.name || ''} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" value={clinic?.phone || ''} onChange={handleChange} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" name="email" value={clinic?.email || ''} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Input placeholder="Street" name="address.street" value={clinic?.address?.street || ''} onChange={handleChange} />
                <Input placeholder="City" name="address.city" value={clinic?.address?.city || ''} onChange={handleChange} />
                <Input placeholder="State" name="address.state" value={clinic?.address?.state || ''} onChange={handleChange} />
                <Input placeholder="Country" name="address.country" value={clinic?.address?.country || ''} onChange={handleChange} />
              </div>
            </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}

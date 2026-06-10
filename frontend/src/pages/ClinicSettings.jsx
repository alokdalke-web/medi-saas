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

  if (loading) return <div>Loading clinic details...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Clinic Settings</CardTitle>
          <CardDescription>Update your clinic information and address</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {message.text && (
              <div className={`p-3 text-sm rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
              </div>
            )}
            
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
          <CardFooter>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

import { useState, useEffect } from "react";
import { fetchApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DoctorFormDialog from "./DoctorFormDialog";

export default function DoctorsList() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const loadDoctors = async () => {
    try {
      const res = await fetchApi('/doctors');
      setDoctors(res.data.doctors);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleAddDoctor = () => {
    setSelectedDoctor(null);
    setIsDialogOpen(true);
  };

  const handleEditDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setIsDialogOpen(true);
  };

  const handleDeleteDoctor = async (id) => {
    if (confirm('Are you sure you want to deactivate this doctor?')) {
      try {
        await fetchApi(`/doctors/${id}`, { method: 'DELETE' });
        loadDoctors();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  if (loading) return <div>Loading doctors...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Doctors</h2>
        {user?.role === 'clinic_admin' && (
          <Button onClick={handleAddDoctor}>Add Doctor</Button>
        )}
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>Experience (Yrs)</TableHead>
              <TableHead>Status</TableHead>
              {user?.role === 'clinic_admin' && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctors.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  No doctors found.
                </TableCell>
              </TableRow>
            )}
            {doctors.map((doc) => (
              <TableRow key={doc._id}>
                <TableCell className="font-medium">{doc.doctorCode}</TableCell>
                <TableCell>{doc.name}</TableCell>
                <TableCell>{doc.specialization}</TableCell>
                <TableCell>{doc.experience}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${doc.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {doc.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                {user?.role === 'clinic_admin' && (
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditDoctor(doc)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteDoctor(doc._id)}>Delete</Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DoctorFormDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        doctor={selectedDoctor}
        onSuccess={loadDoctors}
      />
    </div>
  );
}

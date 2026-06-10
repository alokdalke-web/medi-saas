import { useState, useEffect } from "react";
import { fetchApi } from "../../services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PatientFormDialog from "./PatientFormDialog";

export default function PatientsList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const loadPatients = async (searchQuery = "") => {
    try {
      setLoading(true);
      const url = searchQuery ? `/patients?search=${encodeURIComponent(searchQuery)}` : '/patients';
      const res = await fetchApi(url);
      setPatients(res.data.patients);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadPatients(search);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleAddPatient = () => {
    setSelectedPatient(null);
    setIsDialogOpen(true);
  };

  const handleEditPatient = (patient) => {
    setSelectedPatient(patient);
    setIsDialogOpen(true);
  };

  const handleDeletePatient = async (id) => {
    if (confirm('Are you sure you want to delete this patient?')) {
      try {
        await fetchApi(`/patients/${id}`, { method: 'DELETE' });
        loadPatients(search);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Patients</h2>
        <Button onClick={handleAddPatient}>Add Patient</Button>
      </div>

      <div className="flex items-center space-x-2">
        <Input 
          placeholder="Search by name, ID, or phone..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm bg-white"
        />
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Age</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  Loading...
                </TableCell>
              </TableRow>
            ) : patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  No patients found.
                </TableCell>
              </TableRow>
            ) : (
              patients.map((pat) => (
                <TableRow key={pat._id}>
                  <TableCell className="font-medium">{pat.patientId}</TableCell>
                  <TableCell>{pat.firstName} {pat.lastName}</TableCell>
                  <TableCell>{pat.phone}</TableCell>
                  <TableCell>{pat.gender}</TableCell>
                  <TableCell>
                    {pat.dateOfBirth ? 
                      Math.floor((new Date() - new Date(pat.dateOfBirth)) / 31557600000) 
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditPatient(pat)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeletePatient(pat._id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PatientFormDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        patient={selectedPatient}
        onSuccess={() => loadPatients(search)}
      />
    </div>
  );
}

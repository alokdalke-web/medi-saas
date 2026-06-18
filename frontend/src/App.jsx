import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ConnectionProvider } from "./context/ConnectionContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthLayout from "./layouts/AuthLayout";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ClinicSettings from "./pages/ClinicSettings";
import UsersList from "./pages/Users/UsersList";
import DoctorsList from "./pages/Doctors/DoctorsList";
import PatientsList from "./pages/Patients/PatientsList";
import AppointmentsList from './pages/Appointments/AppointmentsList';
import NetworkNodes from './pages/Network/NetworkNodes';

function App() {
  return (
    <AuthProvider>
      <ConnectionProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
            </Route>

            {/* Protected Main Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/network" element={<NetworkNodes />} />

                {/* Admin & Receptionist Routes */}
                <Route element={<ProtectedRoute allowedRoles={['clinic_admin', 'receptionist']} />}>
                  <Route path="/patients" element={<PatientsList />} />
                  <Route path="/appointments" element={<AppointmentsList />} />
                  <Route path="/doctors" element={<DoctorsList />} />
                </Route>

                {/* Admin Only Routes */}
                <Route element={<ProtectedRoute allowedRoles={['clinic_admin']} />}>
                  <Route path="/users" element={<UsersList />} />
                  <Route path="/settings" element={<ClinicSettings />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ConnectionProvider>
    </AuthProvider>
  );
}

export default App;

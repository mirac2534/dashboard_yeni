import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { EmergencyOperationPage } from './pages/EmergencyOperationPage';
import { HelpPage } from './pages/HelpPage';
import { LoginPage } from './pages/LoginPage';
import { NormalOperationPage } from './pages/NormalOperationPage';
import { OfflineOperationPage } from './pages/OfflineOperationPage';
import { ProfilePage } from './pages/ProfilePage';
import { ZkSnarkPage } from './pages/ZkSnarkPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/normal-operation" replace />} />
          <Route path="/normal-operation" element={<NormalOperationPage />} />
          <Route path="/offline-operation" element={<OfflineOperationPage />} />
          <Route path="/emergency-operation" element={<EmergencyOperationPage />} />
          <Route path="/zk-snark" element={<ZkSnarkPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/help" element={<HelpPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/normal-operation" replace />} />
      </Routes>
    </Router>
  );
}

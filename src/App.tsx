import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Search from '@/pages/Search';
import CardDetail from '@/pages/CardDetail';
import Verify from '@/pages/Verify';
import Appointment from '@/pages/Appointment';
import AlertCenter from '@/pages/AlertCenter';
import Exception from '@/pages/Exception';
import Handover from '@/pages/Handover';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/search" element={<Search />} />
          <Route path="/card/:id" element={<CardDetail />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/appointment" element={<Appointment />} />
          <Route path="/alert" element={<AlertCenter />} />
          <Route path="/exception" element={<Exception />} />
          <Route path="/handover" element={<Handover />} />
        </Route>
      </Routes>
    </Router>
  );
}

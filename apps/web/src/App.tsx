import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import STTTest from './pages/STTTest';
import Parameters from './pages/Parameters';
import Scoring from './pages/Scoring';
import Prompts from './pages/Prompts';
import Telemetry from './pages/Telemetry';
import Logs from './pages/Logs';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/test" replace />} />
        <Route path="/test" element={<STTTest />} />
        <Route path="/parameters" element={<Parameters />} />
        <Route path="/scoring" element={<Scoring />} />
        <Route path="/prompts" element={<Prompts />} />
        <Route path="/telemetry" element={<Telemetry />} />
        <Route path="/logs" element={<Logs />} />
      </Routes>
    </Layout>
  );
}

export default App;

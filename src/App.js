import { Route, Routes, HashRouter as Router } from "react-router-dom"
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/navbar'
import NotFound from './pages/notfound/index.js';
import Home from './pages/home'
import LeadsPage from './pages/leads'
import ProjectsPage from './pages/projects'
import DebugPage from './pages/debug'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:type" element={<ProjectsPage />} />
          <Route path="/debug" element={<DebugPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;




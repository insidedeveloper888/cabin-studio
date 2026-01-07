import { Route, Routes, BrowserRouter as Router } from "react-router-dom"
import Navbar from './components/navbar'
import NotFound from './pages/notfound/index.js';
import Home from './pages/home'
import TestTable from './pages/testtable'
import Messaging from './pages/messaging'

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/test" element={<TestTable />} />
        <Route path="/messaging" element={<Messaging />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;




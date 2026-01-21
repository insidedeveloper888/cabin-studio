import { NavLink } from 'react-router-dom'
import './index.css'

function Navbar() {
    return (
        <nav className="navbar">
            <div className="nav-brand">Cabin Studio</div>
            <div className="nav-links">
                <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                    Home
                </NavLink>
                <NavLink to="/leads" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                    Leads
                </NavLink>
                <NavLink to="/projects" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                    Projects
                </NavLink>
            </div>
        </nav>
    )
}

export default Navbar

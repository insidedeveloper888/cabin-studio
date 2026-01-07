import { NavLink } from 'react-router-dom'
import './index.css'

function Navbar() {
    return (
        <nav className="navbar">
            <div className="nav-brand">Cabin Studio</div>
            <div className="nav-links">
                <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                    Leads
                </NavLink>
                <NavLink to="/test" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                    Test Table
                </NavLink>
                <NavLink to="/messaging" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                    Messaging
                </NavLink>
            </div>
        </nav>
    )
}

export default Navbar

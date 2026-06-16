import React from 'react';
import './navbar.css';
import { Link, useLocation } from 'react-router-dom';
import { useAuthModal } from '../../AuthModal/useAuthModal';
// import svgPaths from '../../imports/ForYouPgae/svg-o2diz6f004';

const Navbar = () => {

    const { pathname } = useLocation();
    const { openLogin } = useAuthModal();

    return (
        <nav className="navbar" style={pathname.includes('/events/') || pathname.includes('/accessories') || pathname.includes('/profile') ? { display: 'none' } : {}}>
            <div className="navbar-container">
                <h1 className="navbar-logo">
                    NITRO<span className="logo-x">X</span>X
                </h1>
                <div className='navbar-action-btn'>
                    <div className="navbar-search">
                        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" color='white' viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search-icon lucide-search"><path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" /></svg>
                    </div>
                    <button type="button" className="navbar-login" onClick={openLogin}>Log In</button>
                    {/* <button type="button" className="navbar-signup">Sign Up</button> */}
                    <Link to='/profile'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" color='white' viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-user-icon lucide-circle-user"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></svg>
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

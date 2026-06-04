import React from 'react';
import './navbar.css';
// import svgPaths from '../../imports/ForYouPgae/svg-o2diz6f004';

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-container">
                <h1 className="navbar-logo">
                    NITRO<span className="logo-x">X</span>X
                </h1>
                <div className='navbar-action-btn'>
                    <button className="navbar-login">Log In</button>
                    <div className="navbar-search">
                        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" color='white' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search-icon lucide-search"><path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" /></svg>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

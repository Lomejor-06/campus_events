import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout: React.FC = () => {
    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />
            <main className="container py-4" style={{ marginTop: '76px' }}>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default Layout;

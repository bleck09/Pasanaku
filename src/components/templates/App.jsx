import React from 'react'
import { Outlet } from 'react-router-dom'
import './App.css'
import ScrollToTop from '../utils/ScrollToTop';
import { Toaster } from 'react-hot-toast';

const App = () => {
    return (
        <div>
            {/* El componente ScrollToTop se ejecuta en cada cambio de ruta */}
            <ScrollToTop />
            <div className="app-content">
                <Outlet />
                
            </div>
            <Toaster position="top-center" reverseOrder={false} toastOptions={{ style: { background: '#FFFFFF', color: '#1F2D3D', border: '1px solid #4A8FD6' } }} />
        </div>
    )
}

export default App
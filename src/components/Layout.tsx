
import React from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      <NavBar />
      <main className="flex-1 overflow-auto p-4 md:p-6 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

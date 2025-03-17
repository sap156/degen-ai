
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Database, BarChart3, TimerReset, Layers, ShieldAlert, Scale, FileJson, Globe, Search, Menu, X, Bug } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AuthButton from '@/components/AuthButton'; // Add import for AuthButton

const NavBar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navItems = [{
    path: '/',
    label: 'Dashboard',
    icon: <Database className="h-4 w-4" />
  }, {
    path: '/synthetic-data',
    label: 'Synthetic Data',
    icon: <Layers className="h-4 w-4" />
  }, {
    path: '/data-augmentation',
    label: 'Data Augmentation',
    icon: <BarChart3 className="h-4 w-4" />
  }, {
    path: '/time-series',
    label: 'Time Series',
    icon: <TimerReset className="h-4 w-4" />
  }, {
    path: '/pii-handling',
    label: 'PII Handling',
    icon: <ShieldAlert className="h-4 w-4" />
  }, {
    path: '/imbalanced-data',
    label: 'Imbalanced Data',
    icon: <Scale className="h-4 w-4" />
  }, {
    path: '/data-parsing',
    label: 'Data Parsing',
    icon: <FileJson className="h-4 w-4" />
  }, {
    path: '/extraction',
    label: 'Data Extraction',
    icon: <Globe className="h-4 w-4" />
  }, {
    path: '/edge-cases',
    label: 'Edge Cases',
    icon: <Bug className="h-4 w-4" />
  }, {
    path: '/data-query',
    label: 'Data Query',
    icon: <Search className="h-4 w-4" />
  }];
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <Database className="h-6 w-6 text-primary" />
            <span className="font-bold">DeGen.AI</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`relative flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.icon}
                    <span className="hidden lg:inline">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </nav>
        </div>
        
        <Button variant="ghost" size="icon" className="ml-auto md:hidden" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <AuthButton />
          </nav>
        </div>
      </div>
    </header>
  );
};

export default NavBar;

import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Database, BarChart3, TimerReset, Layers, ShieldAlert, Scale, FileJson, Globe, Workflow, Search, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
    path: '/entity-recognition',
    label: 'Entity Recognition',
    icon: <Workflow className="h-4 w-4" />
  }, {
    path: '/data-query',
    label: 'Data Query',
    icon: <Search className="h-4 w-4" />
  }];
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  return <header className="sticky top-0 z-50 w-full">
      <div className="glassmorph border-b border-slate-200/20 dark:border-slate-800/20 shadow-sm">
        <div className="container mx-auto flex h-16 items-center px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            <span className="hidden md:inline-block text-lg font-semibold tracking-tight">DeGen.AI</span>
          </div>
          
          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="ml-auto md:hidden" onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          
          {/* Desktop navigation */}
          <nav className="ml-auto mr-4 hidden md:flex">
            <ul className="flex space-x-1">
              {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return <li key={item.path}>
                    <Link to={item.path} className={`relative flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                      {item.icon}
                      <span className="hidden lg:inline">{item.label}</span>
                      {isActive && <motion.div layoutId="navbar-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" initial={{
                    opacity: 0
                  }} animate={{
                    opacity: 1
                  }} transition={{
                    duration: 0.2
                  }} />}
                    </Link>
                  </li>;
            })}
            </ul>
          </nav>
        </div>
      </div>
      
      {/* Mobile navigation menu */}
      {isMobileMenuOpen && <motion.div className="md:hidden glassmorph border-b border-slate-200/20 dark:border-slate-800/20" initial={{
      opacity: 0,
      y: -10
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.2
    }}>
          <nav className="px-4 py-3">
            <ul className="grid grid-cols-2 gap-2">
              {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return <li key={item.path}>
                    <Link to={item.path} className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`} onClick={() => setIsMobileMenuOpen(false)}>
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </li>;
          })}
            </ul>
          </nav>
        </motion.div>}
    </header>;
};
export default NavBar;
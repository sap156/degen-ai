
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, BarChart3, TimerReset, Layers, ShieldAlert, Scale, FileJson, Globe, Search, Menu, X, Bug, User, LogOut, KeyRound } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

const NavBar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isKeySet } = useApiKey();
  
  const navItems = [{
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

  const handleSignOut = async () => {
    await signOut();
    setIsMobileMenuOpen(false);
  };
  
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glassmorph border-b border-slate-200/20 dark:border-slate-800/20 shadow-sm">
        <div className="container mx-auto flex h-16 items-center px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold tracking-tight">DeGen.AI</span>
          </Link>
          
          {user && (
            <Button variant="ghost" size="icon" className="ml-auto md:hidden" onClick={toggleMobileMenu}>
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
          
          <AnimatePresence>
            {user && (
              <motion.nav 
                className="ml-auto mr-4 hidden md:flex"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <ul className="flex space-x-1">
                  {navItems.map(item => {
                    const isActive = location.pathname === item.path;
                    return (
                      <motion.li 
                        key={item.path}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                      >
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
                      </motion.li>
                    );
                  })}
                </ul>
              </motion.nav>
            )}
          </AnimatePresence>
          
          <div className="flex items-center gap-2 ml-auto">
            <ThemeToggle />
            
            <AnimatePresence>
              {user ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <User className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                        {user.email}
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/api-keys" className="flex items-center cursor-pointer">
                          <KeyRound className="mr-2 h-4 w-4" />
                          API Keys {isKeySet && <span className="ml-2 text-xs bg-green-500/20 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full">Active</span>}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {user && isMobileMenuOpen && (
          <motion.div
            className="md:hidden glassmorph border-b border-slate-200/20 dark:border-slate-800/20"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <nav className="px-4 py-3">
              <ul className="grid grid-cols-2 gap-2">
                {navItems.map(item => {
                  const isActive = location.pathname === item.path;
                  return (
                    <motion.li 
                      key={item.path}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link
                        to={item.path}
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                          isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    </motion.li>
                  );
                })}
                <motion.li 
                  className="col-span-2 mt-2"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                >
                  <Link
                    to="/api-keys"
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-secondary/50 hover:bg-secondary transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <KeyRound className="h-4 w-4" />
                    <span>API Keys</span>
                    {isKeySet && <span className="ml-auto text-xs bg-green-500/20 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full">Active</span>}
                  </Link>
                </motion.li>
                <motion.li 
                  className="col-span-2 mt-1"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.2 }}
                >
                  <Button 
                    variant="outline" 
                    className="w-full text-destructive border-destructive/40"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Button>
                </motion.li>
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default NavBar;


import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Users, Map, Settings, Table, Menu, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { useSettings } from '../../hooks/use-settings';
import { useAuth } from '../../hooks/use-auth';

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const { loading, t, settings } = useSettings();
  const { canManageSettings, canManageTables } = useAuth();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let title = `Admin | ${settings.restaurant_name}`;
    if (location.pathname.includes('/dashboard')) title = `${t('dashboard.new_booking')} | Admin`;
    else if (location.pathname.includes('/bookings')) title = `${t('dashboard.manage_bookings')} | Admin`;
    else if (location.pathname.includes('/customers')) title = `${t('dashboard.manage_customers')} | Admin`;
    else if (location.pathname.includes('/tables')) title = `${t('dashboard.manage_tables')} | Admin`;
    else if (location.pathname.includes('/availability')) title = `${t('dashboard.availability')} | Admin`;
    else if (location.pathname.includes('/settings')) title = `${t('admin_settings.title')} | Admin`;
    
    document.title = title;
  }, [location, t, settings.restaurant_name]);
  
  const navItems = [
    { path: '/admin/dashboard', label: t('dashboard.new_booking'), icon: LayoutDashboard, requiredPermission: true },
    { path: '/admin/bookings', label: t('navigation.reservations'), icon: CalendarDays, requiredPermission: true },
    { path: '/admin/customers', label: t('dashboard.customers'), icon: Users, requiredPermission: true },
    { path: '/admin/availability', label: t('dashboard.availability'), icon: Map, requiredPermission: true },
    { path: '/admin/tables', label: t('dashboard.tables'), icon: Table, requiredPermission: canManageTables },
    { path: '/admin/settings', label: t('navigation.settings'), icon: Settings, requiredPermission: canManageSettings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      {navItems.filter(item => item.requiredPermission).map(item => {
        const Icon = item.icon;
        const active = location.pathname === item.path;
        return (
          <Link 
            key={item.path} 
            to={item.path}
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
              active ? 'bg-gold-500/10 text-gold-500' : 'text-neutral-400 hover:bg-dark-800 hover:text-neutral-200'
            } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
            title={sidebarCollapsed ? item.label : ''}
          >
            <Icon size={sidebarCollapsed ? 22 : 18} />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <Navbar />
      
      {/* Mobile Toggle */}
      <div className="md:hidden px-[5%] py-4 flex items-center border-b border-dark-800">
         <button onClick={() => setMobileMenuOpen(true)} className="text-neutral-300 hover:text-white flex items-center gap-2">
            <Menu size={20} />
            <span className="font-serif font-bold text-gold-500">{t('navigation.admin_dashboard')}</span>
         </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
           <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
           <div className="relative w-64 bg-dark-900 border-r border-dark-700 h-full p-4 space-y-2 animate-in slide-in-from-left">
              <div className="flex justify-between items-center mb-6 px-2">
                 <span className="font-serif font-bold text-gold-500 text-lg">{t('navigation.admin_dashboard')}</span>
                 <button onClick={() => setMobileMenuOpen(false)} className="text-neutral-400"><X size={20} /></button>
              </div>
              <SidebarContent />
           </div>
        </div>
      )}

      <div className="flex flex-1 w-[90%] md:w-[var(--content-width)] mx-auto py-8 gap-8 relative">
        
        {/* Desktop Sidebar */}
        <aside className={`hidden md:flex flex-col gap-2 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'} relative`}>
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-3 top-0 w-6 h-6 rounded-full bg-dark-800 border border-dark-600 flex items-center justify-center text-neutral-400 hover:text-white hover:border-gold-500 z-10"
          >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
          <SidebarContent />
        </aside>

        <main className="flex-1 bg-dark-800/30 rounded-xl border border-dark-700 p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

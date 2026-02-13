import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Banknote,
  CreditCard,
  Receipt,
  Coins,
  Scale,
  FileText,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';

const navItems = [
  { path: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/advance', icon: Banknote, labelKey: 'nav.advanceRequisition' },
  { path: '/payment', icon: CreditCard, labelKey: 'nav.paymentRequest' },
  { path: '/expense', icon: Receipt, labelKey: 'nav.expenseSystem' },
  { path: '/petty-cash', icon: Coins, labelKey: 'nav.pettyCash' },
  { path: '/reconciliation', icon: Scale, labelKey: 'nav.reconciliation', accountingOnly: true },
  { path: '/sap-documents', icon: FileText, labelKey: 'nav.sapDocuments', accountingOnly: true },
];

export default function AppLayout() {
  const { t, i18n } = useTranslation();
  const { currentUser, currentRole, switchRole } = useAuth();
  const { getPendingApprovals } = useData();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const pendingCount = getPendingApprovals();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'th' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleRoleSwitch = (role) => {
    switchRole(role);
    setRoleDropdownOpen(false);
  };

  const userInitials = currentUser?.avatar || 'U';

  const filteredNavItems = navItems.filter(
    (item) => !item.accountingOnly || currentRole === 'accounting'
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Shell Bar */}
      <header className="flex h-12 items-center justify-between bg-shell px-4 text-text-inverse shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-1 hover:bg-shell-light rounded"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="text-sm font-semibold tracking-wide">
            Cash Management System
          </h1>
          {pendingCount > 0 && (
            <span className="bg-critical text-white text-xs font-bold rounded-full px-2 py-0.5">
              {pendingCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="px-2 py-1 text-xs font-semibold border border-white/30 rounded hover:bg-shell-light transition-colors"
          >
            {i18n.language === 'en' ? 'TH' : 'EN'}
          </button>

          {/* Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium border border-white/30 rounded hover:bg-shell-light transition-colors"
            >
              {t(`roles.${currentRole}`)}
              <ChevronDown size={14} />
            </button>
            {roleDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setRoleDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-36 bg-bg-secondary border border-border rounded-lg shadow-lg z-50 py-1">
                  {['employee', 'manager', 'accounting'].map((role) => (
                    <button
                      key={role}
                      onClick={() => handleRoleSwitch(role)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-bg-primary transition-colors ${
                        currentRole === role
                          ? 'text-brand font-semibold'
                          : 'text-text-primary'
                      }`}
                    >
                      {t(`roles.${role}`)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* User Avatar */}
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-white"
            title={
              currentUser
                ? `${currentUser.firstNameEn} ${currentUser.lastNameEn}`
                : ''
            }
          >
            {userInitials}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Overlay (mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Side Navigation */}
        <nav
          className={`
            fixed lg:static inset-y-0 left-0 z-20
            w-60 bg-bg-secondary border-r border-border
            pt-12 lg:pt-0
            transform transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            flex flex-col shrink-0
          `}
        >
          <div className="flex-1 overflow-y-auto py-2">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 text-sm transition-colors border-l-3 ${
                      isActive
                        ? 'border-brand bg-brand/5 text-brand font-semibold'
                        : 'border-transparent text-text-secondary hover:bg-bg-primary hover:text-text-primary'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{t(item.labelKey)}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-border p-4">
            <div className="text-xs text-text-secondary">
              {currentUser?.firstNameEn} {currentUser?.lastNameEn}
            </div>
            <div className="text-xs text-text-secondary mt-0.5">
              {currentUser?.position}
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6 bg-bg-primary">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

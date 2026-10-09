import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, LogOut, Sparkles } from 'lucide-react';
import { Avatar } from './PortalUI';

const PortalLayout = ({ sections, activeSectionId, onSectionChange, user, roleLabel, onLogout, children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const activeSection = sections.find((section) => section.id === activeSectionId);
  const ActiveIcon = activeSection?.icon;
  const userName = user?.displayName || user?.email || 'Signed in user';

  return (
    <div className="min-h-screen flex bg-slate-50 text-gray-900">
      <aside
        className={`hidden md:flex md:flex-col sticky top-0 h-screen flex-shrink-0 bg-white border-r border-gray-200 transition-all duration-200 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}
      >
        <div className={`px-4 py-5 border-b border-gray-100 ${sidebarCollapsed ? 'text-center' : ''}`}>
          <div className={`flex items-center ${sidebarCollapsed ? 'flex-col gap-3' : 'justify-between gap-3'}`}>
            <div className={`flex items-center ${sidebarCollapsed ? '' : 'gap-3 min-w-0'}`}>
              <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-glow-blue">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </span>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">Math Whiz Portal</p>
                  <h1 className="text-lg font-bold leading-tight">Workspace</h1>
                  {roleLabel && (
                    <p className="text-xs text-gray-500">{roleLabel}</p>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
              className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              aria-label={sidebarCollapsed ? 'Expand portal sidebar' : 'Collapse portal sidebar'}
              aria-expanded={!sidebarCollapsed}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Portal sections">
          {sections.map((section) => {
            const isActive = section.id === activeSectionId;
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onSectionChange(section.id)}
                aria-current={isActive ? 'page' : undefined}
                title={sidebarCollapsed ? section.label : undefined}
                className={`relative w-full flex items-center rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2.5 text-left'} ${isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                {isActive && !sidebarCollapsed && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-blue-600" aria-hidden="true" />
                )}
                {Icon && <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />}
                {!sidebarCollapsed && <span className="truncate">{section.label}</span>}
                {sidebarCollapsed && <span className="sr-only">{section.label}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200">
          <div className="px-4 md:px-8 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3 min-w-0">
              {ActiveIcon && (
                <span className="hidden sm:inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ActiveIcon className="h-5 w-5" aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-gray-900 leading-tight">{activeSection?.label}</h2>
                {activeSection?.description && (
                  <p className="mt-0.5 text-sm text-gray-500">{activeSection.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 md:justify-end">
              {user && (
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={userName} seed={user.email || userName} size="sm" />
                  <div className="min-w-0 text-left md:text-right">
                    <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                    {user.email && <p className="text-xs text-gray-500 truncate">{user.email}</p>}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex flex-shrink-0 items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
          {sections.length > 1 && (
            <div className="md:hidden px-4 pb-3">
              <label htmlFor="portal-section-select" className="sr-only">Section</label>
              <select
                id="portal-section-select"
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={activeSectionId}
                onChange={(event) => onSectionChange(event.target.value)}
              >
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>{section.label}</option>
                ))}
              </select>
            </div>
          )}
        </header>
        <main className="flex-1 bg-slate-50 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;

import React from 'react';
import { LogOut } from 'lucide-react';

const PortalLayout = ({ sections, activeSectionId, onSectionChange, user, roleLabel, onLogout, children }) => {
  const activeSection = sections.find((section) => section.id === activeSectionId);

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900">
      <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-gray-200">
        <div className="px-5 py-6 border-b border-gray-100">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Math Whiz Portal</p>
          <h1 className="mt-1 text-xl font-bold">Workspace</h1>
          {roleLabel && (
            <p className="text-sm text-gray-500">{roleLabel}</p>
          )}
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {sections.map((section) => {
            const isActive = section.id === activeSectionId;
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left text-sm font-medium transition-colors ${isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                {Icon && <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />}
                <span>{section.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">{roleLabel}</p>
            <h2 className="text-xl font-semibold text-gray-900">{activeSection?.label}</h2>
            {activeSection?.description && (
              <p className="text-sm text-gray-500">{activeSection.description}</p>
            )}
            {sections.length > 1 && (
              <div className="md:hidden">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Section</label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={activeSectionId}
                  onChange={(event) => onSectionChange(event.target.value)}
                >
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>{section.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4 mt-3 md:mt-0">
            {user && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.displayName || user.email || 'Signed in user'}</p>
                {user.email && <p className="text-xs text-gray-500">{user.email}</p>}
              </div>
            )}
            <button
              onClick={onLogout}
              className="inline-flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;

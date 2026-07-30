import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { User } from '../../types';

interface LayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  user: User | null;
  onLogout: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentTab,
  onSelectTab,
  user,
  onLogout,
  children,
}) => {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        role={user?.role}
        onLogout={onLogout}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

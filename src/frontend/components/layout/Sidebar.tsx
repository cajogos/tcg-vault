import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, TableProperties, PlusCircle, Database, FileDown } from 'lucide-react';
import { Separator } from '../ui/separator';

const navItems = [
  { to: '/',          label: 'Binder View',    icon: LayoutGrid,      end: true },
  { to: '/ledger',    label: 'Ledger Sheet',   icon: TableProperties, end: false },
  { to: '/vault/add', label: 'Vault New Asset', icon: PlusCircle,     end: false },
  { to: '/export',    label: 'Buyer Export',    icon: FileDown,        end: false },
] as const;

export const Sidebar: React.FC = () =>
{
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-4 shrink-0 h-full">
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2 py-3">
          <Database className="w-6 h-6 text-indigo-400 shrink-0" />
          <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-indigo-200 to-slate-200 bg-clip-text text-transparent">
            tcg-vault
          </span>
        </div>

        <Separator className="bg-slate-800" />

        <nav className="space-y-1">
          {navItems.map((item) =>
          {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                    {item.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

"use client";

import { createContext, useContext, useState, type ReactNode, useCallback } from 'react';
import { clsx } from 'clsx';

interface TabsContextValue {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

interface TabsProps {
  children: ReactNode;
  defaultTab?: string;
  onTabChange?: (tab: string) => void;
  className?: string;
}

export function Tabs({ children, defaultTab = '', onTabChange, className = '' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  }, [onTabChange]);

  return (
    <TabsContext.Provider value={{ activeTab, onTabChange: handleTabChange }}>
      <div className={clsx('tabs', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabListProps {
  children: ReactNode;
  className?: string;
}

export function TabList({ children, className = '' }: TabListProps) {
  return (
    <div role="tablist" className={clsx('flex border-b border-stone-700', className)}>
      {children}
    </div>
  );
}

interface TabProps {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Tab({ value, children, disabled = false, className = '' }: TabProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tab must be used within Tabs');

  const { activeTab, onTabChange } = context;
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-disabled={disabled}
      onClick={() => !disabled && onTabChange(value)}
      disabled={disabled}
      className={clsx(
        'px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-stone-900',
        isActive
          ? 'text-red-500 border-b-2 border-red-500'
          : 'text-stone-400 hover:text-white hover:bg-stone-800',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
}

interface TabPanelProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabPanel({ value, children, className = '' }: TabPanelProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabPanel must be used within Tabs');

  const { activeTab } = context;
  if (activeTab !== value) return null;

  return <div role="tabpanel" className={clsx('mt-4', className)}>{children}</div>;
}
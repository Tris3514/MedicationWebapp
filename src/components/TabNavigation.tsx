"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export type TabId = "medications" | "weather" | "flights" | "data" | "scraper";

interface Tab {
  id: TabId;
  label: string;
  icon?: React.ReactNode;
}

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

const initialTabs: Tab[] = [
  {
    id: "medications",
    label: "Medication Tracker",
  },
  {
    id: "weather",
    label: "Weather",
  },
  {
    id: "flights",
    label: "Flights",
  },
  {
    id: "data",
    label: "Data",
  },
  {
    id: "scraper",
    label: "Scraper =3",
  },
];

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const [tabs] = useState(initialTabs); // Remove setTabs since we're not reordering anymore
  const [previousTab, setPreviousTab] = useState<TabId | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const prevActiveTabRef = useRef<TabId>(activeTab);

  // Track previous tab when active tab changes
  useEffect(() => {
    if (prevActiveTabRef.current !== activeTab) {
      setPreviousTab(prevActiveTabRef.current);
      prevActiveTabRef.current = activeTab;
    }
  }, [activeTab]);

  return (
    <>
      {/* Click outside to close */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
      
      <div className="relative sm:fixed sm:top-4 sm:left-4 sm:right-auto sm:w-auto z-50 mb-4 sm:mb-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center">
          {/* Active Tab Display */}
          <div className="glass-card rounded-l-md sm:rounded-l-md rounded-r-md sm:rounded-r-none p-1 flex items-center w-full sm:w-auto">
            <button
              onClick={() => {
                console.log('Toggle clicked, current state:', isExpanded);
                setIsExpanded(!isExpanded);
              }}
              className={cn(
                "px-3 py-2 rounded-sm text-sm font-medium transition-all duration-200 relative cursor-pointer w-full sm:w-auto",
                "bg-primary text-primary-foreground shadow-sm flex items-center justify-between sm:justify-start gap-2"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                {tabs.find(tab => tab.id === activeTab)?.icon}
                <span className="truncate">{tabs.find(tab => tab.id === activeTab)?.label}</span>
              </div>
              <div className={cn(
                "transition-transform duration-200 flex-shrink-0",
                isExpanded ? "rotate-180" : "rotate-0"
              )}>
                ▼
              </div>
            </button>
          </div>

          {/* Expandable Tab Menu */}
          <div className={cn(
            "glass-card rounded-r-md sm:rounded-r-md rounded-l-md sm:rounded-l-none p-1 flex items-center transition-all duration-300 overflow-hidden w-full sm:w-auto",
            isExpanded ? "max-w-full sm:max-w-[600px] opacity-100" : "max-w-0 opacity-0"
          )}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 w-full sm:whitespace-nowrap">
              {tabs.filter(tab => tab.id !== activeTab).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Tab clicked:', tab.id, 'Current active:', activeTab);
                    onTabChange(tab.id);
                    setIsExpanded(false);
                  }}
                  className={cn(
                    "px-3 py-2 rounded-sm text-sm font-medium transition-all duration-200 relative w-full sm:w-auto",
                    "hover:bg-white/10 cursor-pointer",
                    previousTab === tab.id && "border-b border-gray-400 dark:border-gray-500",
                    "text-primary-enhanced hover:text-primary-enhanced"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {tab.icon}
                    <span className="truncate">{tab.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

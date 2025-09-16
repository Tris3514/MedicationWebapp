"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Clock } from "@/components/Clock";
import { TabNavigation, TabId } from "@/components/TabNavigation";
import { MedicationTracker } from "@/components/MedicationTracker";
import { WeatherTracker } from "@/components/WeatherTracker";
import { FlightRadar } from "@/components/FlightRadar";
import { DataDashboard } from "@/components/DataDashboard";
import { MaltaBusinessScraper } from "@/components/MaltaBusinessScraper";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("medications");

  const handleTabChange = (tabId: TabId) => {
    console.log('Tab change requested:', tabId);
    setActiveTab(tabId);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "medications":
        return <MedicationTracker />;
      case "weather":
        return <WeatherTracker isActive={activeTab === "weather"} />;
      case "flights":
        return <FlightRadar />;
      case "data":
        return <DataDashboard />;
      case "scraper":
        return <MaltaBusinessScraper />;
      default:
        return <MedicationTracker />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-4 sm:py-8">
      <div className="container mx-auto px-2 sm:px-4 max-w-7xl w-full">
        {/* Header with Clock and Theme Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
          <Clock />
          <ThemeToggle />
        </div>
        
        {/* Tab Navigation */}
        <TabNavigation 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
        />
        
        {/* Tab Content */}
        <div className="mt-4 sm:mt-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

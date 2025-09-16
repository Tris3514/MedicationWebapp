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
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { UserProfile } from "@/components/auth/UserProfile";
import { Button } from "@/components/ui/button";
import { LogIn, User } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("medications");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const { isAuthenticated, user, isLoading } = useAuth();

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-4 sm:py-8">
      <div className="container mx-auto px-2 sm:px-4 max-w-7xl w-full">
        {/* Header with Clock, Auth, and Theme Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
          <Clock />
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUserProfile(!showUserProfile)}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                {user?.name}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>

        {/* User Profile Dropdown */}
        {showUserProfile && isAuthenticated && (
          <div className="fixed top-20 right-4 z-50 sm:top-16 sm:right-4">
            <UserProfile />
          </div>
        )}
        
        {/* Tab Navigation */}
        <TabNavigation 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
        />
        
        {/* Tab Content */}
        <div className="mt-4 sm:mt-6">
          {renderTabContent()}
        </div>

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      </div>
    </div>
  );
}

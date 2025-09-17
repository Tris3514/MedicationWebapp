"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { BarChart3, PieChart, TrendingUp, Database, Settings, GripVertical, MoreHorizontal, Copy, Trash2, Clock, Edit, Menu, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorldClock } from "@/components/WorldClock";
import { NetworkSpeedMonitor } from "@/components/NetworkSpeedMonitor";
import { useUserData } from "@/hooks/useUserData";

export type CardSize = "2x1" | "2x2";

export type ContentType = 
  | "world-clock"
  | "network-speed"
  | "analytics"
  | "performance"
  | "security"
  | "data-insights"
  | "storage"
  | "system-status";

export interface DashboardCard {
  id: string;
  title: string;
  description: string;
  size: CardSize;
  icon: string; // Store icon name instead of React element
  contentType: ContentType; // Store content type instead of React element
}

const initialCards: DashboardCard[] = [
  {
    id: "world-clock",
    title: "World Clock",
    description: "Time in different locations",
    size: "2x2",
    icon: "Clock",
    contentType: "world-clock"
  },
  {
    id: "performance-metrics",
    title: "Performance",
    description: "System performance and trends",
    size: "2x2",
    icon: "TrendingUp",
    contentType: "performance"
  },
  {
    id: "analytics-overview",
    title: "Analytics Overview",
    description: "Key metrics and insights",
    size: "2x2",
    icon: "BarChart3",
    contentType: "analytics"
  },
  {
    id: "network-status",
    title: "Network Status",
    description: "Network performance monitoring",
    size: "2x2",
    icon: "Settings",
    contentType: "system-status"
  },
  {
    id: "data-insights",
    title: "Data Insights",
    description: "AI-powered data analysis",
    size: "2x2",
    icon: "PieChart",
    contentType: "data-insights"
  },
  {
    id: "security-monitor",
    title: "Security Monitor",
    description: "System security and alerts",
    size: "2x2",
    icon: "Database",
    contentType: "security"
  },
  {
    id: "network-speed",
    title: "Network Speed",
    description: "Real-time upload & download monitoring",
    size: "2x2",
    icon: "Wifi",
    contentType: "network-speed"
  }
];

// Card prefabs for the sidebar
const cardPrefabs: Omit<DashboardCard, 'id'>[] = [
  {
    title: "World Clock",
    description: "Time in different locations",
    size: "2x2",
    icon: "Clock",
    contentType: "world-clock"
  },
  {
    title: "Network Speed",
    description: "Real-time upload & download monitoring",
    size: "2x2",
    icon: "Wifi",
    contentType: "network-speed"
  },
  {
    title: "Analytics",
    description: "Key metrics and KPIs",
    size: "2x2",
    icon: "BarChart3",
    contentType: "analytics"
  },
  {
    title: "Storage",
    description: "Usage and capacity",
    size: "2x1",
    icon: "Database",
    contentType: "storage"
  },
  {
    title: "System Status",
    description: "Health monitoring",
    size: "2x1",
    icon: "Settings",
    contentType: "system-status"
  }
];

// Helper function to render icon from string name
const renderIcon = (iconName: string) => {
  const iconProps = { className: "h-5 w-5" };
  switch (iconName) {
    case "Clock": return <Clock {...iconProps} />;
    case "TrendingUp": return <TrendingUp {...iconProps} />;
    case "BarChart3": return <BarChart3 {...iconProps} />;
    case "Settings": return <Settings {...iconProps} />;
    case "PieChart": return <PieChart {...iconProps} />;
    case "Database": return <Database {...iconProps} />;
    case "Wifi": return <Wifi {...iconProps} />;
    default: return <Database {...iconProps} />;
  }
};

// Helper function to render content based on content type
const renderContent = (contentType: ContentType) => {
  switch (contentType) {
    case "world-clock":
      return <WorldClock />;
    case "network-speed":
      return <NetworkSpeedMonitor />;
    case "analytics":
      return (
        <div className="space-y-3 h-full">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-xl font-bold text-primary-enhanced">1,247</div>
              <div className="text-xs text-muted-foreground">Records</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-400">98.5%</div>
              <div className="text-xs text-muted-foreground">Uptime</div>
            </div>
          </div>
          <div className="flex-1 bg-gradient-to-r from-primary/20 to-primary/5 rounded-md flex items-center justify-center min-h-[80px]">
            <span className="text-muted-foreground text-sm">📊 Chart</span>
          </div>
        </div>
      );
    case "performance":
      return (
      <div className="space-y-3 h-full">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-sm font-bold text-blue-400">45ms</div>
            <div className="text-xs text-muted-foreground">Response</div>
          </div>
          <div>
            <div className="text-sm font-bold text-green-400">99.9%</div>
            <div className="text-xs text-muted-foreground">Success</div>
          </div>
          <div>
            <div className="text-sm font-bold text-orange-400">124</div>
            <div className="text-xs text-muted-foreground">Req/min</div>
          </div>
        </div>
        <div className="flex-1 bg-gradient-to-t from-green-500/20 to-transparent rounded-md flex items-end justify-center min-h-[60px]">
          <span className="text-muted-foreground text-xs mb-2">📈 Graph</span>
        </div>
      </div>
      );
    case "security":
      return (
      <div className="space-y-3 h-full">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <div className="text-lg font-bold text-green-400">Secure</div>
            <div className="text-xs text-muted-foreground">Status</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-400">3</div>
            <div className="text-xs text-muted-foreground">Alerts</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span>Firewall</span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span>Encryption</span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span>Intrusion Detection</span>
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          </div>
        </div>
      </div>
      );
    case "data-insights":
      return (
      <div className="space-y-3 h-full">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-purple-400">87%</div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </div>
            <div>
              <div className="text-lg font-bold text-cyan-400">342</div>
              <div className="text-xs text-muted-foreground">Insights</div>
            </div>
          </div>
          <div className="flex-1 bg-gradient-to-br from-purple-500/20 via-cyan-500/20 to-transparent rounded-md flex items-center justify-center min-h-[80px]">
            <span className="text-muted-foreground text-sm">🧠 AI Analysis</span>
          </div>
        </div>
      );
    case "storage":
      return (
      <div className="space-y-2 h-full flex flex-col justify-center">
        <div className="flex justify-between items-center">
          <span className="text-xs">Used</span>
          <span className="font-semibold text-sm">2.4 GB</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-primary h-2 rounded-full" style={{ width: '65%' }}></div>
        </div>
        <div className="text-xs text-muted-foreground">65% of 4 GB used</div>
      </div>
      );
    case "system-status":
      return (
        <div className="space-y-3 h-full">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">Online</div>
              <div className="text-xs text-muted-foreground">Status</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">15ms</div>
              <div className="text-xs text-muted-foreground">Latency</div>
            </div>
          </div>
          <div className="space-y-2">
          <div className="flex justify-between text-xs">
              <span>CPU Usage</span>
            <span>23%</span>
          </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <div className="bg-green-500 h-1 rounded-full" style={{ width: '23%' }}></div>
          </div>
          <div className="flex justify-between text-xs">
            <span>Memory</span>
            <span>67%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <div className="bg-orange-500 h-1 rounded-full" style={{ width: '67%' }}></div>
            </div>
          </div>
        </div>
      );
    default:
      return <div className="text-center text-muted-foreground">Unknown content type</div>;
  }
};

export function DataDashboard() {
  const { isAuthenticated, getData, setData, user, userData } = useUserData();
  const [cards, setCards] = useState<DashboardCard[]>(initialCards);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isRenamingCard, setIsRenamingCard] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [showPrefabsSidebar, setShowPrefabsSidebar] = useState(false);
  const [draggedPrefab, setDraggedPrefab] = useState<number | null>(null);

  // Load saved dashboard cards when user data is available
  useEffect(() => {
    if (isAuthenticated && userData) {
      const savedCards = getData('dashboardCards') || [];
      if (savedCards.length > 0) {
        console.log('Loading saved dashboard cards:', savedCards);
        setCards(savedCards);
      } else {
        console.log('No saved dashboard cards found, using initial cards');
      }
    } else if (!isAuthenticated) {
      // Fallback to localStorage for non-authenticated users
      const savedData = localStorage.getItem('data-dashboard-cards');
      if (savedData) {
        try {
          const parsedCards = JSON.parse(savedData);
          console.log('Loading dashboard cards from localStorage:', parsedCards);
          setCards(parsedCards);
        } catch (error) {
          console.error("Failed to load dashboard cards from storage:", error);
        }
      }
    }
  }, [isAuthenticated, userData, getData]);

  // Save dashboard cards whenever they change (immediate saving)
  useEffect(() => {
    if (cards.length > 0 && isAuthenticated && userData) {
      console.log('Saving dashboard cards to user data:', cards);
      setData('dashboardCards', cards);
    } else if (cards.length > 0 && !isAuthenticated) {
      // Fallback to localStorage for non-authenticated users
      console.log('Saving dashboard cards to localStorage:', cards);
      localStorage.setItem('data-dashboard-cards', JSON.stringify(cards));
    }
  }, [cards, isAuthenticated, userData, setData]);

  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const duplicateCard = (cardId: string) => {
    const cardToDuplicate = cards.find(card => card.id === cardId);
    if (!cardToDuplicate) return;

    const newCard: DashboardCard = {
      ...cardToDuplicate,
      id: generateId(),
      title: `${cardToDuplicate.title} (Copy)`
    };

    setCards(prev => [...prev, newCard]);
  };

  const deleteCard = (cardId: string) => {
    setCards(prev => prev.filter(card => card.id !== cardId));
  };

  const startRename = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (card) {
      setRenameValue(card.title);
      setIsRenamingCard(cardId);
    }
  };

  const confirmRename = () => {
    if (!isRenamingCard || !renameValue.trim()) return;
    
    setCards(prev => prev.map(card => 
      card.id === isRenamingCard 
        ? { ...card, title: renameValue.trim() }
        : card
    ));
    
    setIsRenamingCard(null);
    setRenameValue("");
  };

  const addPrefabCard = (prefabIndex: number, targetIndex?: number) => {
    const prefab = cardPrefabs[prefabIndex];
    if (!prefab) return;

    const newCard: DashboardCard = {
      ...prefab,
      id: generateId()
    };

    if (targetIndex !== undefined) {
      const newCards = [...cards];
      newCards.splice(targetIndex, 0, newCard);
      setCards(newCards);
    } else {
      setCards(prev => [...prev, newCard]);
    }
  };

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggedCard(cardId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", cardId);
  };

  const handleDragOver = (e: React.DragEvent, index?: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedPrefab !== null ? "copy" : "move";
    setDragOverIndex(index ?? -1);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex?: number) => {
    e.preventDefault();
    
    // Handle prefab drop
    if (draggedPrefab !== null) {
      addPrefabCard(draggedPrefab, dropIndex);
      setDraggedPrefab(null);
      setDragOverIndex(null);
      return;
    }

    // Handle card rearrangement
    if (!draggedCard) return;

    const dragIndex = cards.findIndex(card => card.id === draggedCard);
    if (dragIndex === -1) return;

    const newCards = [...cards];
    const draggedItem = newCards[dragIndex];
    
    // Remove the dragged item
    newCards.splice(dragIndex, 1);
    
    // Insert at new position (or at end if dropIndex is undefined)
    if (dropIndex !== undefined) {
      newCards.splice(dropIndex, 0, draggedItem);
    } else {
      newCards.push(draggedItem);
    }
    
    setCards(newCards);
    setDraggedCard(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedCard(null);
    setDragOverIndex(null);
  };

  const getCardGridClasses = (size: CardSize) => {
    switch (size) {
      case "2x1":
        return "col-span-2 sm:col-span-2 lg:col-span-2 row-span-1";
      case "2x2":
        return "col-span-2 sm:col-span-2 lg:col-span-2 row-span-2";
      default:
        return "col-span-1 row-span-1";
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Prefabs Sidebar Toggle */}
      <div className="fixed left-0 top-1/2 transform -translate-y-1/2 z-40 hidden sm:block">
        <div 
          className={cn(
            "glass-card transition-all duration-300 flex rounded-r-lg",
            showPrefabsSidebar ? "translate-x-0" : "-translate-x-48"
          )}
        >
          {/* Sidebar Content */}
          <div className="w-48 p-4 space-y-3">
            <div className="text-sm font-semibold text-primary-enhanced mb-3">Card Library</div>
            {cardPrefabs.map((prefab, index) => (
              <div
                key={index}
                draggable
                onDragStart={(e) => {
                  setDraggedPrefab(index);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onDragEnd={() => setDraggedPrefab(null)}
                className={cn(
                  "glass p-3 rounded-md cursor-move transition-all duration-200",
                  "hover:bg-white/10 border border-black/20 dark:border-white/20",
                  draggedPrefab === index && "opacity-50 scale-95"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  {renderIcon(prefab.icon)}
                  <span className="text-sm font-medium text-primary-enhanced">{prefab.title}</span>
                </div>
                <div className="text-xs text-secondary-enhanced">{prefab.description}</div>
                <div className="text-xs text-primary mt-1 font-mono">{prefab.size}</div>
              </div>
            ))}
          </div>
          
          {/* Toggle Tab */}
          <button
            onClick={() => setShowPrefabsSidebar(!showPrefabsSidebar)}
            className="w-8 glass flex items-center justify-center hover:bg-white/10 transition-colors rounded-r-lg border-l border-black/20 dark:border-white/20"
          >
            <Menu className="h-4 w-4 text-primary-enhanced" />
          </button>
        </div>
      </div>

      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2 text-primary-enhanced">Data Dashboard</h1>
        <p className="text-secondary-enhanced text-sleek">
          Customizable data visualization and monitoring
        </p>
      </div>

      {/* Mobile Prefabs Section */}
      <div className="sm:hidden">
        <div className="glass-card rounded-lg p-4">
          <div className="text-sm font-semibold text-primary-enhanced mb-3">Add Cards</div>
          <div className="grid grid-cols-2 gap-2">
            {cardPrefabs.map((prefab, index) => (
              <button
                key={index}
                onClick={() => addPrefabCard(index)}
                className="p-3 rounded-lg border border-white/20 hover:bg-white/10 transition-colors text-left"
              >
                <div className="flex items-center gap-2 mb-1">
                  {renderIcon(prefab.icon)}
                  <span className="text-sm font-medium">{prefab.title}</span>
                </div>
                <p className="text-xs text-muted-foreground">{prefab.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div 
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 w-full max-w-6xl mx-auto min-h-[400px]"
        onDragOver={(e) => handleDragOver(e)}
        onDrop={(e) => handleDrop(e)}
      >
        {/* Render cards */}
        {cards.map((card, index) => (
          <Card
            key={card.id}
            draggable
            onDragStart={(e) => handleDragStart(e, card.id)}
            onDragOver={(e) => {
              e.stopPropagation();
              handleDragOver(e, index);
            }}
            onDragLeave={handleDragLeave}
            onDrop={(e) => {
              e.stopPropagation();
              handleDrop(e, index);
            }}
            onDragEnd={handleDragEnd}
            className={cn(
              getCardGridClasses(card.size),
              "cursor-move transition-all duration-200 relative flex flex-col glass-card",
              draggedCard === card.id && "opacity-50 scale-95",
              dragOverIndex === index && "ring-2 ring-primary/50 ring-dashed",
              "hover:shadow-lg aspect-square"
            )}
          >
            <CardHeader className={cn(
              "pb-2 flex-shrink-0 relative",
              card.size === "2x1" ? "p-3" : "p-4"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                {renderIcon(card.icon)}
                  <CardTitle className={cn(
                    "text-modern text-primary-enhanced",
                    card.size === "2x1" ? "text-sm" : "text-lg"
                  )}>
                    {card.title}
                  </CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => startRename(card.id)}>
                      <Edit className="mr-2 h-3 w-3" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => duplicateCard(card.id)}>
                      <Copy className="mr-2 h-3 w-3" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => deleteCard(card.id)}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription className={cn(
                "text-sleek text-secondary-enhanced",
                card.size === "2x1" ? "text-xs" : "text-sm"
              )}>
                {card.description}
              </CardDescription>
            </CardHeader>
            <CardContent className={cn(
              "flex-1 flex flex-col justify-center",
              card.size === "2x1" ? "p-3 pt-0" : "p-4 pt-0"
            )}>
              {renderContent(card.contentType)}
            </CardContent>
            
            {/* Drag indicator */}
            {dragOverIndex === index && (
              <div className="absolute inset-0 bg-primary/10 rounded-lg pointer-events-none" />
            )}
          </Card>
        ))}
        
        {/* Empty drop zone indicator */}
        {(draggedCard || draggedPrefab !== null) && (
          <div className="col-span-6 row-span-1 min-h-[100px] border-2 border-dashed border-primary/30 rounded-lg flex items-center justify-center text-muted-foreground">
            Drop here to add to end
          </div>
        )}
      </div>

      {/* Grid Info */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Drag cards to rearrange • 3x3 grid system • Click ⋯ to manage cards • Drag from sidebar to add
        </p>
      </div>

      {/* Rename Dialog */}
      <Dialog open={!!isRenamingCard} onOpenChange={() => setIsRenamingCard(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Card</DialogTitle>
            <DialogDescription>
              Enter a new name for this card.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Card name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  confirmRename();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenamingCard(null)}>
              Cancel
            </Button>
            <Button onClick={confirmRename}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

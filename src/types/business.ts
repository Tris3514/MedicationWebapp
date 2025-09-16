export interface Business {
  id: string;
  name: string;
  specialization: string;
  website: string | null;
  contactNumber: string;
  address?: string;
  email?: string;
  description?: string;
  category: string;
  lastUpdated: Date;
}

export interface BusinessSearchFilters {
  category: string;
  location: string;
  searchTerm: string;
}

export interface ScrapingStatus {
  isLoading: boolean;
  progress: number;
  currentAction: string;
  totalFound: number;
  errors: string[];
}


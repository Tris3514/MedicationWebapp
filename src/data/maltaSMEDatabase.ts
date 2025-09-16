// Master Malta SME Database - Comprehensive Collection
import { restaurantsCafes } from './restaurants-cafes';
import { retailShopping } from './retail-shopping';
import { tourismTravel } from './tourism-travel';
import { professionalServices } from './professional-services';
import { constructionAutomotive } from './construction-automotive';
import { educationRealEstate } from './education-real-estate';

// Additional specialized categories
const hotelsAccommodation = [
  { name: "Casa Rocca Piccola", specialization: "Historic Palace Hotel", website: "https://www.casaroccapiccola.com", contactNumber: "+356 2221 2185", address: "Valletta, Malta", category: "Hotels & Accommodation" },
  { name: "Xara Palace Relais & Châteaux", specialization: "Luxury Boutique Hotel", website: "https://www.xarapalace.com.mt", contactNumber: "+356 2145 0560", address: "Mdina, Malta", category: "Hotels & Accommodation" },
  { name: "Hotel Juliani", specialization: "Boutique Seaside Hotel", website: "https://www.hoteljuliani.com", contactNumber: "+356 2138 8000", address: "St. Julian's, Malta", category: "Hotels & Accommodation" },
  { name: "Palazzo Consiglia", specialization: "Boutique Heritage Hotel", website: "https://www.palazzoconsiglia.com", contactNumber: "+356 2124 3000", address: "Zebbug, Malta", category: "Hotels & Accommodation" },
  { name: "Ta' Cenc Hotel", specialization: "Rural Spa Hotel", website: "https://www.tacenchotel.com", contactNumber: "+356 2155 5555", address: "Sannat, Gozo", category: "Hotels & Accommodation" },
  { name: "Villa Arrigo", specialization: "Country House Hotel", website: "https://www.villaarrigo.com", contactNumber: "+356 2143 3143", address: "Naxxar, Malta", category: "Hotels & Accommodation" },
  { name: "Palazzo Prince d'Orange", specialization: "Historic Boutique Hotel", website: "https://www.palazzoprincedarange.com", contactNumber: "+356 2122 5000", address: "Valletta, Malta", category: "Hotels & Accommodation" },
  { name: "The George Urban Boutique Hotel", specialization: "Modern City Hotel", website: "https://www.thegeorge.com.mt", contactNumber: "+356 2138 8777", address: "St. Julian's, Malta", category: "Hotels & Accommodation" },
  { name: "Hotel Valentina", specialization: "Modern Boutique Hotel", website: "https://www.hotelvalentina.com", contactNumber: "+356 2138 8888", address: "St. Julian's, Malta", category: "Hotels & Accommodation" },
  { name: "Osborne Hotel", specialization: "Family-Run Hotel", website: "https://www.osbornehotel.com", contactNumber: "+356 2124 2120", address: "Valletta, Malta", category: "Hotels & Accommodation" },
  { name: "Pergola Hotel & Spa", specialization: "Spa & Wellness Hotel", website: "https://www.pergolahotel.com", contactNumber: "+356 2137 4000", address: "Mellieha, Malta", category: "Hotels & Accommodation" },
  { name: "The Diplomat Hotel", specialization: "Business Hotel", website: "https://www.diplomathotel.com.mt", contactNumber: "+356 2133 6000", address: "Sliema, Malta", category: "Hotels & Accommodation" },
  { name: "Gillieru Harbour Hotel", specialization: "Harbourfront Hotel", website: "https://www.gillieruharbour.com", contactNumber: "+356 2157 2720", address: "St. Paul's Bay, Malta", category: "Hotels & Accommodation" },
  { name: "Marina Hotel Corinthia Beach Resort", specialization: "Beach Resort Hotel", website: "https://www.marinahotel.com.mt", contactNumber: "+356 2370 2000", address: "St. George's Bay, Malta", category: "Hotels & Accommodation" },
  { name: "Dolmen Resort Hotel", specialization: "Resort & Conference Hotel", website: "https://www.dolmen.com.mt", contactNumber: "+356 2355 2355", address: "Qawra, Malta", category: "Hotels & Accommodation" },
  { name: "Ramla Bay Resort", specialization: "Beach Resort & Spa", website: "https://www.ramlabay.com", contactNumber: "+356 2281 2281", address: "Marfa, Malta", category: "Hotels & Accommodation" },
  { name: "Mellieha Bay Hotel", specialization: "Family Beach Hotel", website: "https://www.melliehabay.com", contactNumber: "+356 2152 2000", address: "Mellieha, Malta", category: "Hotels & Accommodation" },
  { name: "Paradise Bay Resort", specialization: "Resort & Conference Centre", website: "https://www.paradisebay.com.mt", contactNumber: "+356 2152 1166", address: "Cirkewwa, Malta", category: "Hotels & Accommodation" },
  { name: "Seashells Resort", specialization: "All-Inclusive Resort", website: "https://www.seashellsresort.com", contactNumber: "+356 2157 1000", address: "Qawra, Malta", category: "Hotels & Accommodation" },
  { name: "Solana Hotel", specialization: "Budget-Friendly Hotel", website: "https://www.solanahotel.com", contactNumber: "+356 2158 3000", address: "Mellieha, Malta", category: "Hotels & Accommodation" }
];

// Combine all business categories
export const maltaSMEDatabase = [
  ...restaurantsCafes,
  ...retailShopping,
  ...tourismTravel,
  ...professionalServices,
  ...constructionAutomotive,
  ...educationRealEstate,
  ...hotelsAccommodation
];

export const getMaltaSMEsByCategory = (category: string) => {
  if (category === "All Categories") {
    return maltaSMEDatabase;
  }
  return maltaSMEDatabase.filter(business => business.category === category);
};

export const getRandomMaltaSMEs = (category: string = "All Categories", count: number = 20) => {
  const availableBusinesses = getMaltaSMEsByCategory(category);
  const shuffled = [...availableBusinesses].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, availableBusinesses.length));
};

// Get total count by category
export const getMaltaSMECounts = () => {
  const counts: { [key: string]: number } = {};
  
  maltaSMEDatabase.forEach(business => {
    counts[business.category] = (counts[business.category] || 0) + 1;
  });
  
  counts["All Categories"] = maltaSMEDatabase.length;
  
  return counts;
};
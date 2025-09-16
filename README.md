# MedicationWebapp

A comprehensive web application for medication tracking, weather monitoring, flight radar, data dashboard, and business scraping.

## Features

- **Medication Tracker**: Track your medications with reminders and history
- **Weather Tracker**: Monitor weather conditions for multiple locations
- **Flight Radar**: Real-time flight tracking with your location
- **Data Dashboard**: Customizable dashboard with various data cards
- **Business Scraper**: Malta business directory scraper with filtering

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui components
- **APIs**: Open-Meteo (Weather), OpenSky Network (Flights), OpenStreetMap (Geocoding)

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Export static files
npm run export
```

## Deployment

This app is configured for GitHub Pages deployment:

1. **Push to GitHub**: Push your code to a GitHub repository
2. **Enable GitHub Pages**: Go to repository Settings → Pages
3. **Select Source**: Choose "GitHub Actions" as the source
4. **Automatic Deployment**: The app will automatically deploy when you push to the main branch

### GitHub Pages URL

Your app will be available at:
`https://[your-username].github.io/[repository-name]`

## Configuration

The app uses several environment variables and API endpoints:

- **Weather API**: Open-Meteo (free, no API key required)
- **Flight API**: OpenSky Network (free, no API key required)
- **Geocoding**: OpenStreetMap Nominatim (free, no API key required)

## Features Overview

### Medication Tracker
- Add/edit/delete medications
- Set reminders and dosages
- Track medication history
- Persistent storage

### Weather Tracker
- Multiple location support
- Real-time weather data
- 7-day forecast
- Location search with autocomplete

### Flight Radar
- Real-time flight tracking
- User location-based radar
- Nearest aircraft information
- API throttling for respectful usage

### Data Dashboard
- Drag-and-drop card system
- World clock with location selector
- Network speed monitor
- Customizable grid layout

### Business Scraper
- Malta SME database
- Category filtering
- Save/blacklist functionality
- CSV export

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.


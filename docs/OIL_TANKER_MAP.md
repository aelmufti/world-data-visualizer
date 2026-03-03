# 🚢 Oil Tanker Map Feature

Interactive map showing real-time AIS (Automatic Identification System) data for crude oil tankers worldwide.

## Features

- **Live vessel tracking**: Real-time positions of oil tankers
- **Interactive markers**: Click on ships to see detailed information
- **Auto-zoom**: Map automatically adjusts to show all tracked vessels
- **Ship details**: MMSI, name, speed, course, heading, destination, ETA
- **Visual indicators**: Ship icons rotate based on heading direction

## How to Use

1. Navigate to the **Energy** sector in the dashboard
2. Click on the **WTI Crude** indicator card (marked with 🗺️ icon)
3. The map will open in a modal overlay
4. Explore vessel positions and click markers for details
5. Close the map using the ✕ button

## Data Sources

### aisstream.io (Recommended)
- **Type**: WebSocket API for live AIS data
- **Coverage**: Global
- **Free tier**: Available with sign-up
- **Developer experience**: Excellent, actively maintained
- **Documentation**: https://aisstream.io/documentation

### OpenSeaMap / OpenCPN
- **Type**: Open-source, community AIS data
- **Coverage**: Variable by region
- **Use case**: Hobbyists and open-source projects
- **API**: Not a clean REST API, more for direct integration

## Setup for Live Data

### 1. Get API Key
Sign up for a free account at [aisstream.io](https://aisstream.io) and obtain your API key.

### 2. Configure Environment
Add your API key to `.env`:
```env
VITE_AISSTREAM_API_KEY=your_actual_api_key_here
```

### 3. Enable WebSocket Connection
In `src/components/OilTankerMap.tsx`, uncomment the WebSocket code block (lines ~60-120).

The component will automatically:
- Connect to the AIS stream
- Subscribe to position reports
- Filter for oil tankers (ship types 80-89)
- Update vessel positions in real-time

## Ship Types Tracked

The map filters for crude oil tankers with the following classifications:

| Type Code | Description |
|-----------|-------------|
| 80 | Tanker - all ships of this type |
| 81 | Tanker - Hazardous category A |
| 82 | Tanker - Hazardous category B |
| 83 | Tanker - Hazardous category C |
| 84 | Tanker - Hazardous category D |
| 85-89 | Tanker - Reserved for future use |

### Common Tanker Classes
- **VLCC** (Very Large Crude Carrier): 200,000-320,000 DWT
- **Suezmax**: 120,000-200,000 DWT
- **Aframax**: 80,000-120,000 DWT
- **Panamax**: 60,000-80,000 DWT

## Technical Details

### Dependencies
```json
{
  "leaflet": "^1.9.x",
  "react-leaflet": "^4.2.1",
  "@types/leaflet": "^1.9.x"
}
```

### Component Structure
```
OilTankerMap
├── MapContainer (Leaflet)
│   ├── TileLayer (OpenStreetMap)
│   ├── Markers (Vessels)
│   │   └── Popup (Vessel details)
│   └── MapUpdater (Auto-zoom)
├── Header (Title, status, close button)
├── Info Panel (Data sources, vessel count)
└── Footer (Setup instructions, ship types)
```

### WebSocket Message Format
```typescript
{
  MessageType: "PositionReport",
  Message: {
    PositionReport: {
      Latitude: number,
      Longitude: number,
      Sog: number,        // Speed over ground
      Cog: number,        // Course over ground
      TrueHeading: number
    }
  },
  MetaData: {
    MMSI: number,
    ShipName: string,
    ShipType: number,
    Destination: string
  }
}
```

## Demo Mode

By default, the map displays 4 sample vessels for demonstration:
- CRUDE CARRIER 1 (Gulf of Mexico)
- VLCC PACIFIC (Persian Gulf)
- SUEZMAX ATLANTIC (English Channel)
- AFRAMAX NORTH (North Sea)

This allows you to test the UI without an API key.

## Troubleshooting

### Map not displaying
- Check browser console for errors
- Ensure Leaflet CSS is imported in `src/main.tsx`
- Verify all dependencies are installed

### No vessels showing
- Confirm API key is correctly set in `.env`
- Check WebSocket connection status in browser DevTools
- Verify the WebSocket code is uncommented
- Check aisstream.io service status

### Performance issues
- The component limits display to 50 most recent vessels
- Consider adding geographic bounding boxes to reduce data volume
- Implement vessel clustering for high-density areas

## Future Enhancements

- [ ] Add filters for specific tanker classes (VLCC, Suezmax, etc.)
- [ ] Show vessel routes/trails
- [ ] Display port information
- [ ] Add heatmap layer for traffic density
- [ ] Integrate with oil price data for correlation analysis
- [ ] Add historical playback feature
- [ ] Show cargo capacity and estimated cargo value

## Resources

- [AIS Stream Documentation](https://aisstream.io/documentation)
- [Leaflet Documentation](https://leafletjs.com/)
- [React Leaflet Documentation](https://react-leaflet.js.org/)
- [OpenSeaMap](https://www.openseamap.org/)
- [Marine Traffic](https://www.marinetraffic.com/) (reference for ship types)

---

**Last Updated**: March 3, 2026

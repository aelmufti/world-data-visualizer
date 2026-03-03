// Predefined geographic regions for AIS data filtering
// Use these to focus on specific high-traffic oil shipping areas

export interface BoundingBox {
  name: string
  description: string
  coordinates: [[number, number], [number, number]] // [[lat_min, lon_min], [lat_max, lon_max]]
}

export const AIS_REGIONS: BoundingBox[] = [
  {
    name: "Global",
    description: "Worldwide coverage",
    coordinates: [[-90, -180], [90, 180]]
  },
  {
    name: "Persian Gulf",
    description: "Major oil export hub - Middle East",
    coordinates: [[22, 48], [30, 58]]
  },
  {
    name: "Strait of Hormuz",
    description: "Critical oil shipping chokepoint",
    coordinates: [[25, 56], [27, 58]]
  },
  {
    name: "Gulf of Mexico",
    description: "US offshore oil production",
    coordinates: [[27, -98], [31, -88]]
  },
  {
    name: "North Sea",
    description: "European oil production",
    coordinates: [[54, 0], [62, 8]]
  },
  {
    name: "Strait of Malacca",
    description: "Asia-Pacific shipping route",
    coordinates: [[1, 98], [6, 105]]
  },
  {
    name: "English Channel",
    description: "European shipping route",
    coordinates: [[49, -2], [52, 2]]
  },
  {
    name: "Suez Canal",
    description: "Europe-Asia connection",
    coordinates: [[29, 32], [32, 34]]
  },
  {
    name: "Singapore Strait",
    description: "Major Asian hub",
    coordinates: [[1, 103], [2, 105]]
  },
  {
    name: "US East Coast",
    description: "Atlantic seaboard ports",
    coordinates: [[35, -80], [42, -70]]
  },
  {
    name: "West Africa",
    description: "Nigerian oil exports",
    coordinates: [[3, 3], [8, 10]]
  },
  {
    name: "Caribbean",
    description: "Venezuela and regional shipping",
    coordinates: [[10, -85], [20, -60]]
  }
]

// Helper function to get multiple high-traffic regions
export function getHighTrafficRegions(): [[number, number], [number, number]][] {
  return [
    AIS_REGIONS[1].coordinates, // Persian Gulf
    AIS_REGIONS[3].coordinates, // Gulf of Mexico
    AIS_REGIONS[4].coordinates, // North Sea
    AIS_REGIONS[5].coordinates, // Strait of Malacca
  ]
}

// Helper function to get a specific region by name
export function getRegionByName(name: string): BoundingBox | undefined {
  return AIS_REGIONS.find(region => region.name === name)
}

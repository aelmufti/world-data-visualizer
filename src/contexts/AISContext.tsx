import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface Vessel {
  mmsi: number
  name: string
  lat: number
  lon: number
  speed: number
  course: number
  heading: number
  shipType: string
  destination?: string
  eta?: string
  lastUpdate: number
}

interface AISContextType {
  vessels: Vessel[]
  connected: boolean
  vesselCount: number
}

const AISContext = createContext<AISContextType>({
  vessels: [],
  connected: false,
  vesselCount: 0
})

export const useAIS = () => useContext(AISContext)

interface AISProviderProps {
  children: ReactNode
}

export function AISProvider({ children }: AISProviderProps) {
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [connected, setConnected] = useState(false)
  const [useDemoData, setUseDemoData] = useState(false)
  const [shipTypes, setShipTypes] = useState<Map<number, number>>(new Map()) // MMSI -> ShipType

  useEffect(() => {
    let ws: WebSocket | null = null
    let isCleanedUp = false
    let reconnectTimer: NodeJS.Timeout | null = null
    let connectionAttempts = 0
    const MAX_ATTEMPTS = 3
    let receivedDataCount = 0

    const connect = () => {
      if (isCleanedUp) return
      
      connectionAttempts++

      ws = new WebSocket('ws://localhost:8000/api/ais-stream')

      ws.onopen = () => {
        if (isCleanedUp) {
          ws?.close()
          return
        }
        setConnected(true)
        setUseDemoData(false)
        connectionAttempts = 0
      }

      ws.onmessage = (event) => {
        if (isCleanedUp) return
        
        try {
          const data = JSON.parse(event.data)
          
          // Ignorer les messages de contrôle
          if (data.type === 'connected' || data.type === 'error' || data.type === 'closed') {
            return
          }
          
          // Gérer les messages ShipStaticData pour obtenir le type de navire
          if (data.MessageType === "ShipStaticData") {
            const staticData = data.Message.ShipStaticData
            const metadata = data.MetaData
            
            if (staticData.Type !== undefined) {
              setShipTypes(prev => {
                const updated = new Map(prev)
                updated.set(metadata.MMSI, staticData.Type)
                return updated
              })
            }
            return
          }
          
          if (data.MessageType === "PositionReport") {
            receivedDataCount++
            
            const msg = data.Message.PositionReport
            const metadata = data.MetaData
            
            // Utiliser le ShipType du cache si disponible, sinon utiliser celui des métadonnées
            const shipType = shipTypes.get(metadata.MMSI) || metadata.ShipType
            
            // Accepter TOUS les navires, même sans ShipType
            const vessel: Vessel = {
              mmsi: metadata.MMSI,
              name: metadata.ShipName || `MMSI ${metadata.MMSI}`,
              lat: msg.Latitude,
              lon: msg.Longitude,
              speed: msg.Sog || 0,
              course: msg.Cog || 0,
              heading: msg.TrueHeading || msg.Cog || 0,
              shipType: shipType ? getShipTypeName(shipType) : "Other",
              destination: metadata.Destination,
              lastUpdate: Date.now()
            }
            
            setVessels(prev => {
              // Supprimer l'ancien si existe
              const filtered = prev.filter(v => v.mmsi !== vessel.mmsi)
              // Ajouter le nouveau et garder les 20000 plus récents
              const updated = [...filtered, vessel]
              return updated.slice(-20000)
            })
          }
        } catch (err) {
          // Erreur silencieuse
        }
      }

      ws.onerror = () => {
        if (isCleanedUp) return
        setConnected(false)
      }

      ws.onclose = () => {
        if (isCleanedUp) return
        setConnected(false)
        
        // Si on a dépassé le nombre max de tentatives, utiliser les données de démo
        if (connectionAttempts >= MAX_ATTEMPTS) {
          setUseDemoData(true)
          loadDemoData()
          return
        }
        
        // Reconnexion automatique après 5 secondes
        if (!isCleanedUp) {
          reconnectTimer = setTimeout(connect, 5000)
        }
      }
    }
    
    // Fonction pour charger des données de démo
    const loadDemoData = () => {
      const demoVessels: Vessel[] = [
        // Tankers dans le Golfe Persique
        { mmsi: 123456789, name: "DEMO TANKER 1", lat: 26.5, lon: 56.3, speed: 12.5, course: 90, heading: 90, shipType: "Tanker", destination: "ROTTERDAM", lastUpdate: Date.now() },
        { mmsi: 123456790, name: "DEMO TANKER 2", lat: 25.8, lon: 55.1, speed: 10.2, course: 180, heading: 180, shipType: "Tanker", destination: "SINGAPORE", lastUpdate: Date.now() },
        { mmsi: 123456791, name: "DEMO TANKER 3", lat: 27.2, lon: 57.5, speed: 11.8, course: 270, heading: 270, shipType: "Tanker", destination: "HOUSTON", lastUpdate: Date.now() },
        
        // Tankers dans l'Atlantique
        { mmsi: 234567890, name: "ATLANTIC CRUDE", lat: 40.7, lon: -74.0, speed: 13.5, course: 45, heading: 45, shipType: "Tanker", destination: "NEW YORK", lastUpdate: Date.now() },
        { mmsi: 234567891, name: "OCEAN SPIRIT", lat: 51.5, lon: -0.1, speed: 9.5, course: 135, heading: 135, shipType: "Tanker", destination: "LONDON", lastUpdate: Date.now() },
        
        // Cargo ships
        { mmsi: 345678901, name: "CARGO EXPRESS", lat: 35.7, lon: 139.7, speed: 15.0, course: 0, heading: 0, shipType: "Cargo Ship", destination: "TOKYO", lastUpdate: Date.now() },
        { mmsi: 345678902, name: "PACIFIC TRADER", lat: 1.3, lon: 103.8, speed: 14.2, course: 90, heading: 90, shipType: "Cargo Ship", destination: "SINGAPORE", lastUpdate: Date.now() },
        
        // Passenger ships
        { mmsi: 456789012, name: "CRUISE LINER", lat: 25.8, lon: -80.2, speed: 18.0, course: 180, heading: 180, shipType: "Passenger", destination: "MIAMI", lastUpdate: Date.now() },
      ]
      
      setVessels(demoVessels)
      setConnected(true) // Simuler une connexion
    }

    // Démarrer la connexion
    connect()

    return () => {
      isCleanedUp = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [])

  return (
    <AISContext.Provider value={{ vessels, connected, vesselCount: vessels.length }}>
      {children}
      {useDemoData && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          background: 'rgba(245, 158, 11, 0.95)',
          color: '#000',
          padding: '12px 16px',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          ⚠️ Using demo data - AIS stream unavailable
        </div>
      )}
    </AISContext.Provider>
  )
}

function getShipTypeName(type: number): string {
  // AIS Ship Type codes (based on ITU-R M.1371-5)
  if (type >= 80 && type <= 89) return "Tanker"
  if (type >= 70 && type <= 79) return "Cargo Ship"
  if (type >= 60 && type <= 69) return "Passenger"
  if (type >= 40 && type <= 49) return "High Speed Craft"
  if (type >= 30 && type <= 39) return "Fishing"
  if (type >= 20 && type <= 29) return "Wing In Ground"
  
  // Specific types
  if (type === 50) return "Pilot Vessel"
  if (type === 51) return "Search and Rescue"
  if (type === 52) return "Tug"
  if (type === 53) return "Port Tender"
  if (type === 54) return "Anti-pollution"
  if (type === 55) return "Law Enforcement"
  if (type === 58) return "Medical Transport"
  if (type === 59) return "Non-combatant Ship"
  
  return "Other"
}

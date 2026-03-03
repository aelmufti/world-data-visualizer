import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAIS, Vessel } from '../contexts/AISContext'

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface OilTankerMapProps {
  onClose: () => void
}

function MapUpdater({ vessels }: { vessels: Vessel[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (vessels.length > 0) {
      const bounds = L.latLngBounds(vessels.map(v => [v.lat, v.lon]))
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [vessels, map])
  
  return null
}

export default function OilTankerMap({ onClose }: OilTankerMapProps) {
  // Utiliser les données du contexte global
  const { vessels: globalVessels, connected, vesselCount } = useAIS()
  const [selectedRegion, setSelectedRegion] = useState("Global")

  const createTankerIcon = (heading: number) => {
    return L.divIcon({
      html: `<div style="transform: rotate(${heading}deg); font-size: 24px;">🚢</div>`,
      className: 'tanker-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    })
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.9)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div style={{
        width: '100%',
        maxWidth: 1400,
        height: '90vh',
        background: '#0A1628',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>
              🚢 Oil Tanker Tracking - WTI Crude
            </h2>
            <p style={{ fontSize: 13, color: '#64748B' }}>
              Live AIS data from oil tankers worldwide
              {connected && <span style={{ color: '#10B981', marginLeft: 8 }}>● Connected</span>}
              <span style={{ marginLeft: 8 }}>• {vesselCount} vessels tracked</span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              disabled
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '8px 12px',
                color: '#94A3B8',
                fontSize: 13,
                cursor: 'not-allowed',
                opacity: 0.6
              }}
              title="Region selection requires reconnection"
            >
              <option value="High Traffic Zones">High Traffic Zones</option>
              <option value="Global">Global Coverage</option>
            </select>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: '8px 16px',
              color: '#F1F5F9',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Info Panel */}
        <div style={{
          padding: '12px 24px',
          background: 'rgba(245,158,11,0.1)',
          borderBottom: '1px solid rgba(245,158,11,0.2)',
          fontSize: 12,
          color: '#F59E0B'
        }}>
          <strong>Data Sources:</strong> aisstream.io (WebSocket API) • OpenSeaMap / OpenCPN (Community AIS) • 
          {vesselCount} vessels tracked (live data)
        </div>

        {/* Map */}
        <div style={{ flex: 1, position: 'relative' }}>
          <MapContainer
            center={[30, 0]}
            zoom={2}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {globalVessels.map((vessel) => (
              <Marker
                key={vessel.mmsi}
                position={[vessel.lat, vessel.lon]}
                icon={createTankerIcon(vessel.heading)}
              >
                <Popup>
                  <div style={{ minWidth: 200 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                      {vessel.name}
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                      <div><strong>MMSI:</strong> {vessel.mmsi}</div>
                      <div><strong>Type:</strong> {vessel.shipType}</div>
                      <div><strong>Speed:</strong> {vessel.speed.toFixed(1)} knots</div>
                      <div><strong>Course:</strong> {vessel.course}°</div>
                      <div><strong>Heading:</strong> {vessel.heading}°</div>
                      {vessel.destination && (
                        <div><strong>Destination:</strong> {vessel.destination}</div>
                      )}
                      {vessel.eta && (
                        <div><strong>ETA:</strong> {vessel.eta}</div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
            
            <MapUpdater vessels={globalVessels} />
          </MapContainer>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: 11,
          color: '#475569',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <div>
            💡 To enable live data: Sign up at <a href="https://aisstream.io" target="_blank" rel="noopener noreferrer" style={{ color: '#F59E0B' }}>aisstream.io</a> and add your API key to .env
          </div>
          <div>
            Ship types: VLCC, Suezmax, Aframax, Panamax
          </div>
        </div>
      </div>
    </div>
  )
}

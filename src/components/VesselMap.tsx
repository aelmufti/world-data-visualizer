import { useState } from 'react'
import DeckGL from '@deck.gl/react'
import { ScatterplotLayer } from '@deck.gl/layers'
import { Map } from 'react-map-gl/maplibre'
import { useAIS } from '../contexts/AISContext'
import 'maplibre-gl/dist/maplibre-gl.css'

interface VesselMapProps {
  onClose: () => void
}

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 2,
  pitch: 0,
  bearing: 0
}

export default function VesselMap({ onClose }: VesselMapProps) {
  const { vessels, connected, vesselCount } = useAIS()
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE)

  // Vérifier que les données sont valides
  const validVessels = vessels.filter(v => 
    v && 
    typeof v.lon === 'number' && 
    typeof v.lat === 'number' &&
    !isNaN(v.lon) && 
    !isNaN(v.lat) &&
    v.lon >= -180 && v.lon <= 180 &&
    v.lat >= -90 && v.lat <= 90
  )

  // Créer la couche de points pour les navires
  // Recréer à chaque changement de vesselCount pour forcer le re-render
  const layers = [
    new ScatterplotLayer({
      id: 'vessels-scatter',
      data: validVessels,
      pickable: true,
      opacity: 0.8,
      stroked: true,
      filled: true,
      radiusScale: 1,
      radiusMinPixels: 5,
      radiusMaxPixels: 15,
      lineWidthMinPixels: 1,
      getPosition: (d: any) => [d.lon, d.lat],
      getRadius: 100,
      getFillColor: (d: any) => {
        // Couleur selon le type de navire
        if (d.shipType.includes('Tanker')) return [239, 68, 68, 255] // Rouge pour tankers
        if (d.shipType.includes('Cargo')) return [59, 130, 246, 255] // Bleu pour cargo
        if (d.shipType.includes('Passenger')) return [34, 197, 94, 255] // Vert pour passagers
        return [156, 163, 175, 255] // Gris pour autres
      },
      getLineColor: [255, 255, 255, 255],
      onClick: (info: any) => {
        if (info.object) {
          console.log('Vessel clicked:', info.object)
        }
      }
    })
  ]

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#000',
      zIndex: 1000
    }}>
      {/* Header */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '20px 24px',
        background: 'rgba(10, 22, 40, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        zIndex: 1001,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F1F5F9', marginBottom: 4, margin: 0 }}>
            🚢 Live Vessel Tracking - Global AIS Data
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0 0' }}>
            {connected ? (
              <>
                <span style={{ color: '#10B981' }}>● Connected</span>
                <span style={{ marginLeft: 12 }}>• {vesselCount} vessels tracked</span>
              </>
            ) : (
              <span style={{ color: '#F59E0B' }}>● Connecting...</span>
            )}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8,
            padding: '10px 20px',
            color: '#F1F5F9',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        padding: '16px 20px',
        background: 'rgba(10, 22, 40, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        zIndex: 1001
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#F1F5F9', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Legend
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444' }} />
            <span style={{ fontSize: 12, color: '#E2E8F0' }}>Tankers</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#3B82F6' }} />
            <span style={{ fontSize: 12, color: '#E2E8F0' }}>Cargo Ships</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22C55E' }} />
            <span style={{ fontSize: 12, color: '#E2E8F0' }}>Passenger</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#9CA3AF' }} />
            <span style={{ fontSize: 12, color: '#E2E8F0' }}>Other</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        position: 'absolute',
        top: 100,
        right: 20,
        padding: '16px 20px',
        background: 'rgba(10, 22, 40, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        zIndex: 1001,
        minWidth: 200
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#F1F5F9', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Statistics
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: '#64748B', marginBottom: 2 }}>Total Vessels</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#F1F5F9', fontFamily: 'monospace' }}>
              {vesselCount.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#64748B', marginBottom: 2 }}>Tankers</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#EF4444', fontFamily: 'monospace' }}>
              {vessels.filter(v => v.shipType.includes('Tanker')).length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#64748B', marginBottom: 2 }}>Cargo Ships</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#3B82F6', fontFamily: 'monospace' }}>
              {vessels.filter(v => v.shipType.includes('Cargo')).length}
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }: any) => setViewState(viewState)}
        controller={true}
        layers={layers}
        getTooltip={({ object }: any) => {
          if (!object) return null
          return {
            html: `
              <div style="font-family: sans-serif; padding: 8px;">
                <div style="font-weight: bold; margin-bottom: 4px;">${object.name}</div>
                <div style="font-size: 11px; color: #888;">MMSI: ${object.mmsi}</div>
                <div style="font-size: 11px; color: #888;">Type: ${object.shipType}</div>
                <div style="font-size: 11px; color: #888;">Speed: ${object.speed.toFixed(1)} knots</div>
                ${object.destination ? `<div style="font-size: 11px; color: #888;">Destination: ${object.destination}</div>` : ''}
              </div>
            `,
            style: {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              color: '#fff',
              borderRadius: '8px',
              padding: '0'
            }
          }
        }}
      >
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          attributionControl={false}
        />
      </DeckGL>

      {/* Empty state */}
      {vesselCount === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          zIndex: 1002
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚢</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#F1F5F9', marginBottom: 8 }}>
            {connected ? 'Waiting for vessel data...' : 'Connecting to AIS stream...'}
          </div>
          <div style={{ fontSize: 14, color: '#64748B' }}>
            {connected ? 'Vessels will appear as they are detected' : 'Please wait while we establish connection'}
          </div>
        </div>
      )}
    </div>
  )
}

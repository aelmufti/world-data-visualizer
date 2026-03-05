import { useState, useEffect } from 'react';
import { fearGreedService, type FearGreedData } from '../services/fearGreedService';

export default function FearGreedPanel() {
  const [data, setData] = useState<FearGreedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const result = await fearGreedService.getBothIndices();
        setData(result);
      } catch (err: any) {
        console.error('Error fetching fear & greed data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    // Refresh every 30 minutes
    const interval = setInterval(fetchData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const renderGauge = (value: number) => {
    const rotation = (value / 100) * 180 - 90; // -90 to 90 degrees

    return (
      <div style={{ position: 'relative', width: 120, height: 60, margin: '0 auto' }}>
        {/* Background arc */}
        <svg width="120" height="60" style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="25%" stopColor="#F97316" />
              <stop offset="50%" stopColor="#64748B" />
              <stop offset="75%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#22C55E" />
            </linearGradient>
          </defs>
          <path
            d="M 10 55 A 50 50 0 0 1 110 55"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </svg>
        
        {/* Needle */}
        <div
          style={{
            position: 'absolute',
            bottom: 5,
            left: '50%',
            width: 2,
            height: 45,
            background: '#F1F5F9',
            transformOrigin: 'bottom center',
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            transition: 'transform 0.5s ease',
            boxShadow: '0 0 4px rgba(0,0,0,0.5)'
          }}
        />
        
        {/* Center dot */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#F1F5F9',
            transform: 'translateX(-50%)',
            boxShadow: '0 0 4px rgba(0,0,0,0.5)'
          }}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding: 24,
        textAlign: 'center'
      }}>
        <div style={{ color: '#64748B', fontSize: 14 }}>Loading Fear & Greed Index...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding: 24,
        textAlign: 'center'
      }}>
        <div style={{ color: '#EF4444', fontSize: 14 }}>Failed to load Fear & Greed Index</div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      padding: 24
    }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ 
          fontSize: 18, 
          fontWeight: 600, 
          color: '#F1F5F9',
          marginBottom: 4
        }}>
          😨 Fear & Greed Index
        </h2>
        <p style={{ fontSize: 12, color: '#64748B' }}>
          Market sentiment indicators
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr',
        gap: 20
      }}>
        {/* Stock Market Index */}
        {data.stock && (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 8,
            padding: 16
          }}>
            <div style={{ 
              fontSize: 13, 
              fontWeight: 600, 
              color: '#F1F5F9',
              marginBottom: 12,
              textAlign: 'center'
            }}>
              📈 Stock Market
            </div>

            {renderGauge(data.stock.value)}

            <div style={{ 
              textAlign: 'center',
              marginTop: 12
            }}>
              <div style={{ 
                fontSize: 32, 
                fontWeight: 700, 
                color: data.stock.color,
                fontFamily: "'DM Mono', monospace",
                lineHeight: 1
              }}>
                {data.stock.value}
              </div>
              <div style={{ 
                fontSize: 14, 
                fontWeight: 600,
                color: data.stock.color,
                marginTop: 4
              }}>
                {data.stock.classification}
              </div>
              {data.stock.vix && (
                <div style={{ 
                  fontSize: 11, 
                  color: '#64748B',
                  marginTop: 8,
                  fontFamily: "'DM Mono', monospace"
                }}>
                  VIX: {data.stock.vix}
                </div>
              )}
              <div style={{ 
                fontSize: 9, 
                color: '#475569',
                marginTop: 4
              }}>
                {data.stock.source}
              </div>
            </div>
          </div>
        )}

        {/* Crypto Market Index */}
        {data.crypto && (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 8,
            padding: 16
          }}>
            <div style={{ 
              fontSize: 13, 
              fontWeight: 600, 
              color: '#F1F5F9',
              marginBottom: 12,
              textAlign: 'center'
            }}>
              ₿ Crypto Market
            </div>

            {renderGauge(data.crypto.value)}

            <div style={{ 
              textAlign: 'center',
              marginTop: 12
            }}>
              <div style={{ 
                fontSize: 32, 
                fontWeight: 700, 
                color: data.crypto.color,
                fontFamily: "'DM Mono', monospace",
                lineHeight: 1
              }}>
                {data.crypto.value}
              </div>
              <div style={{ 
                fontSize: 14, 
                fontWeight: 600,
                color: data.crypto.color,
                marginTop: 4
              }}>
                {data.crypto.classification}
              </div>
              <div style={{ 
                fontSize: 9, 
                color: '#475569',
                marginTop: 8
              }}>
                {data.crypto.source}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ 
        marginTop: 20,
        padding: 12,
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 8
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          fontSize: 10,
          color: '#64748B'
        }}>
          <span style={{ color: '#EF4444' }}>0 Extreme Fear</span>
          <span style={{ color: '#64748B' }}>50 Neutral</span>
          <span style={{ color: '#22C55E' }}>100 Extreme Greed</span>
        </div>
      </div>

      <div style={{ 
        marginTop: 12,
        fontSize: 10,
        color: '#475569',
        textAlign: 'center',
        fontFamily: "'DM Mono', monospace"
      }}>
        Updated: {new Date(data.timestamp).toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </div>
    </div>
  );
}

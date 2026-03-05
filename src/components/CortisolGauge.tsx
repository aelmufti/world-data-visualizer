import { useState, useEffect } from 'react';
import { cortisolService, type CortisolData } from '../services/cortisolService';

export default function CortisolGauge() {
  const [data, setData] = useState<CortisolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const result = await cortisolService.getCortisolLevel();
        setData(result);
      } catch (err: any) {
        console.error('Error fetching cortisol data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    // Refresh every 10 minutes
    const interval = setInterval(fetchData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const renderGauge = (level: number) => {
    const rotation = (level / 100) * 180 - 90; // -90 to 90 degrees

    return (
      <div style={{ position: 'relative', width: 160, height: 80, margin: '0 auto' }}>
        {/* Background arc */}
        <svg width="160" height="80" style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <linearGradient id="cortisolGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22C55E" />
              <stop offset="20%" stopColor="#10B981" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="60%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
          </defs>
          <path
            d="M 15 70 A 65 65 0 0 1 145 70"
            fill="none"
            stroke="url(#cortisolGradient)"
            strokeWidth="12"
            strokeLinecap="round"
          />
        </svg>
        
        {/* Needle */}
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: '50%',
            width: 3,
            height: 55,
            background: '#1e293b',
            transformOrigin: 'bottom center',
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            transition: 'transform 0.8s cubic-bezier(0.4, 0.0, 0.2, 1)',
            boxShadow: '0 0 6px rgba(0,0,0,0.6)',
            borderRadius: '2px 2px 0 0'
          }}
        />
        
        {/* Center dot */}
        <div
          style={{
            position: 'absolute',
            bottom: 5,
            left: '50%',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#1e293b',
            transform: 'translateX(-50%)',
            boxShadow: '0 0 6px rgba(0,0,0,0.5)',
            border: '2px solid #f8fafc'
          }}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: 24,
        textAlign: 'center',
        boxShadow: '10px 10px 20px rgba(163, 177, 198, 0.6), -10px -10px 20px rgba(255, 255, 255, 0.9)'
      }}>
        <div style={{ color: '#4a5568', fontSize: 14 }}>Loading Cortisol Level...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: 24,
        textAlign: 'center',
        boxShadow: '10px 10px 20px rgba(163, 177, 198, 0.6), -10px -10px 20px rgba(255, 255, 255, 0.9)'
      }}>
        <div style={{ color: '#EF4444', fontSize: 14, fontWeight: 600 }}>Failed to load Cortisol Level</div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 20,
      padding: 24,
      boxShadow: '10px 10px 20px rgba(163, 177, 198, 0.6), -10px -10px 20px rgba(255, 255, 255, 0.9)'
    }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ 
          fontSize: 18, 
          fontWeight: 600, 
          color: '#0f172a',
          marginBottom: 4
        }}>
          {cortisolService.getEmoji(data.level)} Market Cortisol Level
        </h2>
        <p style={{ fontSize: 12, color: '#4a5568', fontWeight: 500 }}>
          Aggregate stress indicator from all market signals
        </p>
      </div>

      {/* Main Gauge */}
      <div style={{
        background: '#f8fafc',
        borderRadius: 16,
        padding: 20,
        boxShadow: 'inset 4px 4px 8px rgba(163, 177, 198, 0.3), inset -4px -4px 8px rgba(255, 255, 255, 0.5)'
      }}>
        {renderGauge(data.level)}

        <div style={{ 
          textAlign: 'center',
          marginTop: 16
        }}>
          <div style={{ 
            fontSize: 48, 
            fontWeight: 700, 
            color: data.color,
            fontFamily: "'DM Mono', monospace",
            lineHeight: 1,
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
          }}>
            {data.level}
          </div>
          <div style={{ 
            fontSize: 16, 
            fontWeight: 600,
            color: data.color,
            marginTop: 8,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            {data.classification}
          </div>
        </div>
      </div>

      {/* Toggle Details Button */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        style={{
          width: '100%',
          marginTop: 16,
          padding: '10px 16px',
          background: '#f8fafc',
          border: 'none',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          color: '#475569',
          cursor: 'pointer',
          boxShadow: '3px 3px 6px rgba(163, 177, 198, 0.4), -3px -3px 6px rgba(255, 255, 255, 0.8)',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = 'inset 2px 2px 4px rgba(163, 177, 198, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '3px 3px 6px rgba(163, 177, 198, 0.4), -3px -3px 6px rgba(255, 255, 255, 0.8)';
        }}
      >
        {showDetails ? '▲ Hide Details' : '▼ Show Contributing Factors'}
      </button>

      {/* Details Panel */}
      {showDetails && (
        <div style={{
          marginTop: 16,
          padding: 16,
          background: '#f8fafc',
          borderRadius: 12,
          boxShadow: 'inset 3px 3px 6px rgba(163, 177, 198, 0.3), inset -3px -3px 6px rgba(255, 255, 255, 0.5)'
        }}>
          <div style={{ 
            fontSize: 13, 
            fontWeight: 600, 
            color: '#0f172a',
            marginBottom: 12
          }}>
            Contributing Factors
          </div>

          {/* Fear & Greed */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 4
            }}>
              <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>
                😨 Fear & Greed (inverted)
              </span>
              <span style={{ 
                fontSize: 12, 
                fontWeight: 600,
                color: '#0f172a',
                fontFamily: "'DM Mono', monospace"
              }}>
                +{data.factors.fearGreed.contribution}
              </span>
            </div>
            <div style={{ 
              height: 6,
              background: '#e2e8f0',
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${data.factors.fearGreed.contribution}%`,
                background: 'linear-gradient(90deg, #F97316, #EF4444)',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>

          {/* News Sentiment */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 4
            }}>
              <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>
                📰 News Sentiment
              </span>
              <span style={{ 
                fontSize: 12, 
                fontWeight: 600,
                color: '#0f172a',
                fontFamily: "'DM Mono', monospace"
              }}>
                +{data.factors.newsSentiment.contribution}
              </span>
            </div>
            <div style={{ 
              height: 6,
              background: '#e2e8f0',
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${data.factors.newsSentiment.contribution}%`,
                background: 'linear-gradient(90deg, #F59E0B, #F97316)',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>

          {/* Market Volatility */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 4
            }}>
              <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>
                📊 Market Volatility (VIX)
              </span>
              <span style={{ 
                fontSize: 12, 
                fontWeight: 600,
                color: '#0f172a',
                fontFamily: "'DM Mono', monospace"
              }}>
                +{data.factors.marketVolatility.contribution}
              </span>
            </div>
            <div style={{ 
              height: 6,
              background: '#e2e8f0',
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${data.factors.marketVolatility.contribution}%`,
                background: 'linear-gradient(90deg, #10B981, #F59E0B)',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>

          {/* News Volume */}
          <div style={{ marginBottom: 0 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 4
            }}>
              <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>
                📡 News Volume
              </span>
              <span style={{ 
                fontSize: 12, 
                fontWeight: 600,
                color: '#0f172a',
                fontFamily: "'DM Mono', monospace"
              }}>
                +{data.factors.newsVolume.contribution}
              </span>
            </div>
            <div style={{ 
              height: 6,
              background: '#e2e8f0',
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${data.factors.newsVolume.contribution}%`,
                background: 'linear-gradient(90deg, #22C55E, #10B981)',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ 
        marginTop: 16,
        padding: 12,
        background: '#f8fafc',
        borderRadius: 8,
        boxShadow: 'inset 2px 2px 4px rgba(163, 177, 198, 0.2), inset -2px -2px 4px rgba(255, 255, 255, 0.5)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          fontSize: 10,
          fontWeight: 600
        }}>
          <span style={{ color: '#22C55E' }}>0 Zen</span>
          <span style={{ color: '#F59E0B' }}>50 Alert</span>
          <span style={{ color: '#EF4444' }}>100 Panic</span>
        </div>
      </div>

      <div style={{ 
        marginTop: 12,
        fontSize: 10,
        color: '#64748b',
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

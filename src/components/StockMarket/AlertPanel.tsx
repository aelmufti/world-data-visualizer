/**
 * AlertPanel Component
 * 
 * Manages price alerts with:
 * - List of active alerts with symbol, condition, target price, status
 * - Form to create new alerts
 * - Enable/disable toggle for each alert
 * - Edit and delete actions
 * - 20-alert capacity limit
 * - Persistence to localStorage
 */

import { useState } from 'react';
import type { AlertPanelProps, PriceAlert } from '../../types/stock-market';

const MAX_ALERTS = 20;

export const AlertPanel: React.FC<AlertPanelProps> = ({
  alerts,
  onCreate,
  onDelete,
  onEdit
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    symbol: '',
    condition: 'above' as 'above' | 'below',
    targetPrice: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (!formData.symbol.trim()) {
      setError('Please enter a stock symbol');
      return;
    }

    const price = parseFloat(formData.targetPrice);
    if (isNaN(price) || price <= 0) {
      setError('Please enter a valid target price');
      return;
    }

    // Check capacity limit
    if (!editingId && alerts.length >= MAX_ALERTS) {
      setError(`Maximum ${MAX_ALERTS} alerts allowed`);
      return;
    }

    if (editingId) {
      // Edit existing alert
      const existingAlert = alerts.find(a => a.id === editingId);
      if (existingAlert) {
        onEdit(editingId, {
          ...existingAlert,
          symbol: formData.symbol.toUpperCase(),
          condition: formData.condition,
          targetPrice: price
        });
      }
      setEditingId(null);
    } else {
      // Create new alert
      const newAlert: PriceAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        symbol: formData.symbol.toUpperCase(),
        condition: formData.condition,
        targetPrice: price,
        enabled: true,
        createdAt: new Date().toISOString()
      };
      onCreate(newAlert);
    }

    // Reset form
    setFormData({ symbol: '', condition: 'above', targetPrice: '' });
    setShowForm(false);
  };

  const handleEdit = (alert: PriceAlert) => {
    setEditingId(alert.id);
    setFormData({
      symbol: alert.symbol,
      condition: alert.condition,
      targetPrice: alert.targetPrice.toString()
    });
    setShowForm(true);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ symbol: '', condition: 'above', targetPrice: '' });
    setShowForm(false);
    setError(null);
  };

  const handleToggleEnabled = (alert: PriceAlert) => {
    onEdit(alert.id, {
      ...alert,
      enabled: !alert.enabled
    });
  };

  const formatPrice = (price: number): string => {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getAlertStatus = (alert: PriceAlert): { text: string; color: string } => {
    if (alert.triggeredAt) {
      return { text: 'Triggered', color: 'text-yellow-500' };
    }
    if (!alert.enabled) {
      return { text: 'Disabled', color: 'text-gray-500' };
    }
    return { text: 'Active', color: 'text-green-500' };
  };

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 20,
      boxShadow: '10px 10px 20px rgba(163, 177, 198, 0.6), -10px -10px 20px rgba(255, 255, 255, 0.9)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottom: '2px solid rgba(163, 177, 198, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>Price Alerts</h3>
          <span style={{ fontSize: 14, color: '#4a5568', fontWeight: 500 }}>
            ({alerts.length}/{MAX_ALERTS})
          </span>
        </div>
        
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              handleCancelEdit();
            }
          }}
          style={{
            padding: '8px 14px',
            background: showForm ? '#e0e5ec' : 'linear-gradient(145deg, #667eea, #764ba2)',
            color: showForm ? '#4a5568' : '#fff',
            fontSize: 13,
            fontWeight: 600,
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            transition: 'all 0.3s',
            boxShadow: showForm 
              ? 'inset 3px 3px 6px rgba(163, 177, 198, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.5)'
              : '4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8)'
          }}
        >
          {showForm ? 'Cancel' : '+ New Alert'}
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div style={{
          padding: 16,
          borderBottom: '2px solid rgba(163, 177, 198, 0.2)',
          background: '#f8fafc'
        }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>
            {editingId ? 'Edit Alert' : 'Create New Alert'}
          </h4>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Symbol input */}
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#4a5568', marginBottom: 4, fontWeight: 500 }}>
                Stock Symbol
              </label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                placeholder="e.g., AAPL"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#e0e5ec',
                  border: 'none',
                  borderRadius: 10,
                  color: '#1a202c',
                  fontSize: 14,
                  outline: 'none',
                  boxShadow: 'inset 3px 3px 6px rgba(163, 177, 198, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.5)'
                }}
                required
              />
            </div>

            {/* Condition and target price */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#4a5568', marginBottom: 4, fontWeight: 500 }}>
                  Condition
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value as 'above' | 'below' })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: '#e0e5ec',
                    border: 'none',
                    borderRadius: 10,
                    color: '#1a202c',
                    fontSize: 14,
                    outline: 'none',
                    cursor: 'pointer',
                    boxShadow: 'inset 3px 3px 6px rgba(163, 177, 198, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.5)'
                  }}
                >
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#4a5568', marginBottom: 4, fontWeight: 500 }}>
                  Target Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.targetPrice}
                  onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: '#e0e5ec',
                    border: 'none',
                    borderRadius: 10,
                    color: '#1a202c',
                    fontSize: 14,
                    outline: 'none',
                    boxShadow: 'inset 3px 3px 6px rgba(163, 177, 198, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.5)'
                  }}
                  required
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                padding: 8,
                background: 'rgba(220, 38, 38, 0.1)',
                border: '2px solid rgba(220, 38, 38, 0.3)',
                borderRadius: 8,
                color: '#dc2626',
                fontSize: 13,
                fontWeight: 500
              }}>
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '10px 16px',
                background: 'linear-gradient(145deg, #667eea, #764ba2)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8)'
              }}
            >
              {editingId ? 'Update Alert' : 'Create Alert'}
            </button>
          </form>
        </div>
      )}

      {/* Alerts list */}
      <div style={{ padding: '8px 0' }}>
        {alerts.length === 0 ? (
          <div style={{
            padding: 32,
            textAlign: 'center',
            color: '#4a5568'
          }}>
            <svg style={{
              width: 48,
              height: 48,
              margin: '0 auto 12px',
              color: '#64748b'
            }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p style={{ fontSize: 14, fontWeight: 500 }}>No price alerts</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Create an alert to get notified</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const status = getAlertStatus(alert);
            const statusColor = status.text === 'Triggered' ? '#ea580c' : status.text === 'Disabled' ? '#64748b' : '#10B981';
            
            return (
              <div
                key={alert.id}
                style={{
                  padding: 12,
                  margin: '8px 12px',
                  background: '#f8fafc',
                  borderRadius: 12,
                  transition: 'all 0.2s',
                  boxShadow: 'inset 2px 2px 4px rgba(163, 177, 198, 0.2), inset -2px -2px 4px rgba(255, 255, 255, 0.5)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  {/* Left: Alert info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: '#0f172a', fontWeight: 600, fontSize: 14 }}>{alert.symbol}</span>
                      <span style={{ fontSize: 11, color: statusColor, fontWeight: 600 }}>
                        {status.text}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: 13, color: '#4a5568' }}>
                      Alert when price goes{' '}
                      <span style={{ color: '#1a202c', fontWeight: 600 }}>{alert.condition}</span>{' '}
                      <span style={{ color: '#1a202c', fontWeight: 600 }}>${formatPrice(alert.targetPrice)}</span>
                    </div>

                    {alert.triggeredAt && (
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                        Triggered: {new Date(alert.triggeredAt).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 16 }}>
                    {/* Enable/disable toggle */}
                    <button
                      onClick={() => handleToggleEnabled(alert)}
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: '#e0e5ec',
                        color: alert.enabled ? '#10B981' : '#64748b',
                        boxShadow: '4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = 'inset 3px 3px 6px rgba(163, 177, 198, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.5)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8)'
                      }}
                      aria-label={alert.enabled ? 'Disable alert' : 'Enable alert'}
                      title={alert.enabled ? 'Disable alert' : 'Enable alert'}
                    >
                      <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {alert.enabled ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        )}
                      </svg>
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => handleEdit(alert)}
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: '#e0e5ec',
                        color: '#667eea',
                        boxShadow: '4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = 'inset 3px 3px 6px rgba(163, 177, 198, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.5)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8)'
                      }}
                      aria-label="Edit alert"
                      title="Edit alert"
                    >
                      <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => onDelete(alert.id)}
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: '#e0e5ec',
                        color: '#dc2626',
                        boxShadow: '4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = 'inset 3px 3px 6px rgba(163, 177, 198, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.5)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.8)'
                      }}
                      aria-label="Delete alert"
                      title="Delete alert"
                    >
                      <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {alerts.length > 0 && (
        <div style={{ 
          padding: 12, 
          borderTop: '2px solid rgba(163, 177, 198, 0.2)', 
          fontSize: 11, 
          color: '#64748b',
          textAlign: 'center',
          fontWeight: 500
        }}>
          Alerts will trigger browser notifications when conditions are met
        </div>
      )}
    </div>
  );
};

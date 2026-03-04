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
    <div className="bg-[#0A1628] rounded-lg border border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">Price Alerts</h3>
          <span className="text-sm text-gray-500">
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
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Alert'}
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="p-4 border-b border-gray-800 bg-[#060B14]">
          <h4 className="text-sm font-semibold text-white mb-3">
            {editingId ? 'Edit Alert' : 'Create New Alert'}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Symbol input */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Stock Symbol
              </label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                placeholder="e.g., AAPL"
                className="w-full px-3 py-2 bg-[#0A1628] border border-gray-700 rounded text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* Condition and target price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Condition
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value as 'above' | 'below' })}
                  className="w-full px-3 py-2 bg-[#0A1628] border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Target Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.targetPrice}
                  onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-[#0A1628] border border-gray-700 rounded text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-2 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              {editingId ? 'Update Alert' : 'Create Alert'}
            </button>
          </form>
        </div>
      )}

      {/* Alerts list */}
      <div className="divide-y divide-gray-800">
        {alerts.length === 0 ? (
          <div style={{
            padding: 32,
            textAlign: 'center',
            color: '#64748B'
          }}>
            <svg style={{
              width: 48,
              height: 48,
              margin: '0 auto 12px',
              color: '#475569'
            }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p>No price alerts</p>
            <p className="text-sm mt-1">Create an alert to get notified</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const status = getAlertStatus(alert);
            
            return (
              <div
                key={alert.id}
                className="p-4 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  {/* Left: Alert info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold">{alert.symbol}</span>
                      <span className={`text-xs ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-400">
                      Alert when price goes{' '}
                      <span className="text-white font-medium">{alert.condition}</span>{' '}
                      <span className="text-white font-medium">${formatPrice(alert.targetPrice)}</span>
                    </div>

                    {alert.triggeredAt && (
                      <div className="text-xs text-gray-600 mt-1">
                        Triggered: {new Date(alert.triggeredAt).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {/* Enable/disable toggle */}
                    <button
                      onClick={() => handleToggleEnabled(alert)}
                      className={`p-2 rounded transition-colors ${
                        alert.enabled
                          ? 'text-green-500 hover:bg-gray-800'
                          : 'text-gray-600 hover:bg-gray-800'
                      }`}
                      aria-label={alert.enabled ? 'Disable alert' : 'Enable alert'}
                      title={alert.enabled ? 'Disable alert' : 'Enable alert'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      className="p-2 text-gray-500 hover:text-blue-400 hover:bg-gray-800 rounded transition-colors"
                      aria-label="Edit alert"
                      title="Edit alert"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => onDelete(alert.id)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
                      aria-label="Delete alert"
                      title="Delete alert"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="p-3 border-t border-gray-800 text-xs text-gray-600">
          Alerts will trigger browser notifications when conditions are met
        </div>
      )}
    </div>
  );
};

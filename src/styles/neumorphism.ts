// Neumorphism Design System - Reusable Styles

export const neuColors = {
  background: '#e0e5ec',
  cardBackground: '#ffffff',  // Blanc pur pour les cartes
  text: '#1a202c',        
  textLight: '#4a5568',   
  textDark: '#0f172a',    
  primary: '#667eea',
  secondary: '#764ba2',
  success: '#48bb78',
  danger: '#f56565',
  warning: '#ed8936',
  info: '#4299e1',
}

export const neuShadows = {
  raised: '8px 8px 16px rgba(163, 177, 198, 0.6), -8px -8px 16px rgba(255, 255, 255, 0.9)',
  raisedSmall: '4px 4px 8px rgba(163, 177, 198, 0.5), -4px -4px 8px rgba(255, 255, 255, 0.9)',
  raisedLarge: '10px 10px 20px rgba(163, 177, 198, 0.6), -10px -10px 20px rgba(255, 255, 255, 0.9)',
  pressed: 'inset 4px 4px 8px rgba(163, 177, 198, 0.5), inset -4px -4px 8px rgba(255, 255, 255, 0.5)',
  pressedSmall: 'inset 3px 3px 6px rgba(163, 177, 198, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.5)',
}

export const neuCard = {
  background: '#ffffff',  // Blanc pur
  borderRadius: '20px',
  padding: '24px',
  boxShadow: neuShadows.raisedLarge,
}

export const neuButton = {
  background: neuColors.background,
  border: 'none',
  borderRadius: '12px',
  padding: '10px 20px',
  color: neuColors.text,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: neuShadows.raisedSmall,
  fontWeight: 600,
}

export const neuInput = {
  background: neuColors.background,
  border: 'none',
  borderRadius: '12px',
  padding: '12px 16px',
  color: neuColors.textDark,
  outline: 'none',
  boxShadow: neuShadows.pressed,
  fontFamily: "'Poppins', sans-serif",
}

export const neuBadge = (color: string) => ({
  background: `linear-gradient(145deg, ${color}20, ${color}10)`,
  borderRadius: '8px',
  padding: '6px 12px',
  fontSize: '11px',
  fontWeight: 600,
  color: color,
  boxShadow: `inset 2px 2px 4px rgba(163, 177, 198, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 0.5)`,
})

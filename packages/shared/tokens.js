/**
 * CipherSchools design tokens.
 * Single source of truth, imported by both apps' tailwind.config.js
 * and used directly in a few places that need raw hex values (charts, canvas).
 */
module.exports = {
  colors: {
    canvas: '#F5F6F8',
    surface: '#FFFFFF',
    'text-primary': '#22252A',
    'text-secondary': '#6B7280',
    'text-tertiary': '#9AA0AA',
    'text-body-alt': '#4A4E56',
    accent: '#F2871F',
    'accent-ink': '#C06A10',
    'accent-nav-ink': '#B4610F',
    'accent-tint': 'rgba(242,135,31,0.12)',
    border: '#E7E8EC',
    'border-soft': '#F0F1F4',
    'present-bg': '#ECF7F0',
    'present-fg': '#1E5E3E',
    'present-border': '#CFE9DA',
    'present-dot': '#2E8B57',
    'leave-bg': '#FBF3E4',
    'leave-fg': '#8A6216',
    'leave-border': '#EEDFC0',
    'leave-body': '#5E4A16',
    'leave-dot': '#C99A2E',
    'flagged-bg': '#FDECEC',
    'flagged-fg': '#B4322F',
    'flagged-border': '#F3CFCF',
    'flagged-banner-text': '#8A2E2C',
    'toggle-off': '#D7D9DE',
    'camera-bg': '#1A1C20',
  },
  radius: {
    sm: '9px',
    md: '12px',
    lg: '14px',
    xl: '16px',
    pill: '999px',
  },
  shadow: {
    card: '0 1px 2px rgba(34,37,42,.04), 0 8px 24px rgba(34,37,42,.05)',
    'button-orange': '0 6px 16px rgba(242,135,31,.26)',
    modal: '0 24px 60px rgba(26,28,32,.28)',
    sheet: '0 -12px 40px rgba(34,37,42,.18)',
  },
};

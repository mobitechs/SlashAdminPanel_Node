// utils/constants.js
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator'
};

export const TRANSACTION_STATUSES = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  PROCESSING: 'processing'
};

export const PAYMENT_METHODS = {
  UPI: 'UPI',
  CREDIT_CARD: 'Credit Card',
  DEBIT_CARD: 'Debit Card',
  NET_BANKING: 'Net Banking',
  WALLET: 'Wallet'
};

export const VERIFICATION_STATUSES = {
  VERIFIED: 'verified',
  UNVERIFIED: 'unverified',
  PENDING: 'pending'
};

// Color schemes for charts
export const CHART_COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#6366F1',
  purple: '#8B5CF6'
};

export const STATUS_COLORS = {
  success: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200'
  },
  warning: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200'
  },
  danger: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200'
  },
  info: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200'
  }
};
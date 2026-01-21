import './index.css'

// Predefined color schemes for common status types
const STATUS_COLORS = {
    // Project status
    'New': { bg: '#e8f3ff', color: '#3370ff' },
    'In Progress': { bg: '#fff7e6', color: '#fa8c16' },
    'Completed': { bg: '#d1fae5', color: '#059669' },
    'On Hold': { bg: '#f5f6f7', color: '#646a73' },
    'Cancelled': { bg: '#fef0f0', color: '#f54a45' },

    // Payment status
    'Pending': { bg: '#fff7e6', color: '#fa8c16' },
    'Partial': { bg: '#e8f3ff', color: '#3370ff' },
    'Paid': { bg: '#d1fae5', color: '#059669' },
    'Overdue': { bg: '#fef0f0', color: '#f54a45' },

    // Generic
    'Active': { bg: '#d1fae5', color: '#059669' },
    'Inactive': { bg: '#f5f6f7', color: '#646a73' },
    'Yes': { bg: '#d1fae5', color: '#059669' },
    'No': { bg: '#fef0f0', color: '#f54a45' },

    // Default
    'default': { bg: '#f5f6f7', color: '#646a73' }
}

/**
 * Status badge component with consistent styling
 * @param {string} status - Status text
 * @param {string} type - Status type for color (optional, auto-detected from status)
 * @param {string} size - 'small' | 'medium' (default)
 */
function StatusBadge({ status, type, size = 'medium' }) {
    if (!status) return null

    // Get colors - try exact match first, then type, then default
    const colors = STATUS_COLORS[status] || STATUS_COLORS[type] || STATUS_COLORS['default']

    return (
        <span
            className={`status-badge status-badge-${size}`}
            style={{
                backgroundColor: colors.bg,
                color: colors.color
            }}
        >
            {status}
        </span>
    )
}

/**
 * Get status color scheme for external use (e.g., kanban columns)
 */
export function getStatusColor(status) {
    return STATUS_COLORS[status] || STATUS_COLORS['default']
}

export default StatusBadge

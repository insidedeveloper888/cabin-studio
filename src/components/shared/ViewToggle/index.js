import './index.css'

/**
 * Toggle between different view modes (list, kanban, calendar)
 * @param {string} value - Current view mode
 * @param {Function} onChange - Callback when view changes
 * @param {Array} options - Available options [{value, label, icon?}]
 */
function ViewToggle({ value, onChange, options }) {
    const defaultOptions = [
        { value: 'list', label: 'List', icon: '☰' },
        { value: 'kanban', label: 'Kanban', icon: '▤' },
        { value: 'calendar', label: 'Calendar', icon: '📅' }
    ]

    const viewOptions = options || defaultOptions

    return (
        <div className="view-toggle">
            {viewOptions.map(option => (
                <button
                    key={option.value}
                    className={`view-toggle-btn ${value === option.value ? 'active' : ''}`}
                    onClick={() => onChange(option.value)}
                    title={option.label}
                >
                    {option.icon && <span className="view-icon">{option.icon}</span>}
                    <span className="view-label">{option.label}</span>
                </button>
            ))}
        </div>
    )
}

export default ViewToggle

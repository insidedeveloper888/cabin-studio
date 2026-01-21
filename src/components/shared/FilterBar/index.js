import { useState } from 'react'
import './index.css'

/**
 * Reusable filter bar with search, date range, and select filters
 * @param {Function} onSearch - Callback for search term changes
 * @param {Array} filters - Filter definitions [{key, label, options, value}]
 * @param {Function} onFilterChange - Callback when filter changes (key, value)
 * @param {Object} dateRange - {startDate, endDate}
 * @param {Function} onDateRangeChange - Callback for date range changes
 * @param {Function} onClear - Callback to clear all filters
 * @param {string} searchPlaceholder - Search input placeholder
 */
function FilterBar({
    onSearch,
    searchValue = '',
    filters = [],
    onFilterChange,
    dateRange,
    onDateRangeChange,
    onClear,
    searchPlaceholder = 'Search...'
}) {
    const [localSearch, setLocalSearch] = useState(searchValue)

    const handleSearchChange = (e) => {
        const value = e.target.value
        setLocalSearch(value)
        onSearch?.(value)
    }

    const hasActiveFilters = () => {
        if (localSearch) return true
        if (dateRange?.startDate || dateRange?.endDate) return true
        return filters.some(f => f.value && f.value !== '')
    }

    return (
        <div className="filter-bar">
            {/* Search box */}
            {onSearch && (
                <div className="filter-search">
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={localSearch}
                        onChange={handleSearchChange}
                    />
                </div>
            )}

            {/* Date range filters */}
            {onDateRangeChange && (
                <div className="filter-date-range">
                    <input
                        type="date"
                        value={dateRange?.startDate || ''}
                        onChange={e => onDateRangeChange({ ...dateRange, startDate: e.target.value })}
                        placeholder="Start date"
                    />
                    <span className="date-separator">to</span>
                    <input
                        type="date"
                        value={dateRange?.endDate || ''}
                        onChange={e => onDateRangeChange({ ...dateRange, endDate: e.target.value })}
                        placeholder="End date"
                    />
                </div>
            )}

            {/* Select filters */}
            <div className="filter-selects">
                {filters.map(filter => (
                    <select
                        key={filter.key}
                        value={filter.value || ''}
                        onChange={e => onFilterChange?.(filter.key, e.target.value)}
                        className={filter.value ? 'has-value' : ''}
                    >
                        <option value="">{filter.label}</option>
                        {filter.options?.map(option => (
                            <option key={option.value || option} value={option.value || option}>
                                {option.label || option}
                            </option>
                        ))}
                    </select>
                ))}
            </div>

            {/* Clear button */}
            {onClear && hasActiveFilters() && (
                <button className="filter-clear-btn" onClick={onClear}>
                    Clear
                </button>
            )}
        </div>
    )
}

export default FilterBar

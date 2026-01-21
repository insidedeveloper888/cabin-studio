import { useState, useMemo } from 'react'
import './index.css'

/**
 * Reusable data table with sorting and pagination
 * @param {Array} data - Array of record objects with fields
 * @param {Array} columns - Column definitions [{key, label, width?, render?}]
 * @param {Function} onRowClick - Callback when row is clicked
 * @param {string} emptyMessage - Message when no data
 * @param {boolean} loading - Loading state
 */
function DataTable({
    data = [],
    columns = [],
    onRowClick,
    emptyMessage = 'No records found',
    loading = false,
    className = ''
}) {
    const [sortKey, setSortKey] = useState(null)
    const [sortDir, setSortDir] = useState('asc')

    const handleSort = (key) => {
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
        } else {
            setSortKey(key)
            setSortDir('asc')
        }
    }

    const sortedData = useMemo(() => {
        if (!sortKey) return data

        return [...data].sort((a, b) => {
            const aVal = a.fields?.[sortKey] ?? ''
            const bVal = b.fields?.[sortKey] ?? ''

            // Handle different types
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDir === 'asc' ? aVal - bVal : bVal - aVal
            }

            // String comparison
            const aStr = String(aVal).toLowerCase()
            const bStr = String(bVal).toLowerCase()

            if (sortDir === 'asc') {
                return aStr.localeCompare(bStr)
            } else {
                return bStr.localeCompare(aStr)
            }
        })
    }, [data, sortKey, sortDir])

    const getCellValue = (record, column) => {
        const value = record.fields?.[column.key]

        if (column.render) {
            return column.render(value, record)
        }

        if (value === null || value === undefined || value === '') {
            return '-'
        }

        // Handle arrays
        if (Array.isArray(value)) {
            if (value.length === 0) return '-'
            // Handle user/person fields
            if (value[0]?.name) {
                return value.map(v => v.name).join(', ')
            }
            return value.join(', ')
        }

        // Handle dates (timestamps)
        if (typeof value === 'number' && value > 1000000000000) {
            return new Date(value).toLocaleDateString()
        }

        return String(value)
    }

    if (loading) {
        return <div className="data-table-loading">Loading...</div>
    }

    return (
        <div className={`data-table-container ${className}`}>
            <table className="data-table">
                <thead>
                    <tr>
                        {columns.map(column => (
                            <th
                                key={column.key}
                                style={column.width ? { width: column.width } : undefined}
                                className={column.sortable !== false ? 'sortable' : ''}
                                onClick={() => column.sortable !== false && handleSort(column.key)}
                            >
                                <span className="th-content">
                                    {column.label}
                                    {sortKey === column.key && (
                                        <span className="sort-indicator">
                                            {sortDir === 'asc' ? ' ▲' : ' ▼'}
                                        </span>
                                    )}
                                </span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map(record => (
                        <tr
                            key={record.record_id}
                            onClick={() => onRowClick?.(record)}
                            className={onRowClick ? 'clickable' : ''}
                        >
                            {columns.map(column => (
                                <td
                                    key={column.key}
                                    className={column.className || ''}
                                >
                                    {getCellValue(record, column)}
                                </td>
                            ))}
                        </tr>
                    ))}
                    {sortedData.length === 0 && (
                        <tr>
                            <td colSpan={columns.length} className="empty-row">
                                {emptyMessage}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}

export default DataTable

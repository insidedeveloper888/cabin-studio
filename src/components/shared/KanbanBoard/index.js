import { useState, useCallback } from 'react'
import StatusBadge, { getStatusColor } from '../StatusBadge'
import './index.css'

/**
 * Kanban board with drag-and-drop support
 * @param {Array} data - Array of record objects
 * @param {string} groupByField - Field to group by (e.g., 'Project Status')
 * @param {Array} columns - Column definitions [{value, label}]
 * @param {Function} onCardClick - Callback when card is clicked
 * @param {Function} onStatusChange - Callback when card is dropped to new column
 * @param {Object} cardConfig - Card display config {titleField, subtitleField, fields}
 */
function KanbanBoard({
    data = [],
    groupByField = 'Project Status',
    columns = [],
    onCardClick,
    onStatusChange,
    cardConfig = {}
}) {
    const [draggedCard, setDraggedCard] = useState(null)
    const [dragOverColumn, setDragOverColumn] = useState(null)

    const defaultColumns = [
        { value: 'New', label: 'New' },
        { value: 'In Progress', label: 'In Progress' },
        { value: 'Completed', label: 'Completed' }
    ]

    const kanbanColumns = columns.length > 0 ? columns : defaultColumns

    // Group data by status
    const groupedData = useCallback(() => {
        const groups = {}

        // Initialize all columns
        kanbanColumns.forEach(col => {
            groups[col.value] = []
        })

        // Group records
        data.forEach(record => {
            const status = record.fields?.[groupByField] || 'New'
            // Handle array values (Lark single select)
            const statusValue = Array.isArray(status) ? status[0] : status

            if (groups[statusValue]) {
                groups[statusValue].push(record)
            } else {
                // Put in first column if status doesn't match any column
                const firstCol = kanbanColumns[0]?.value
                if (firstCol && groups[firstCol]) {
                    groups[firstCol].push(record)
                }
            }
        })

        return groups
    }, [data, groupByField, kanbanColumns])

    const handleDragStart = (e, record, fromColumn) => {
        setDraggedCard({ record, fromColumn })
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragEnd = () => {
        setDraggedCard(null)
        setDragOverColumn(null)
    }

    const handleDragOver = (e, columnValue) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setDragOverColumn(columnValue)
    }

    const handleDragLeave = () => {
        setDragOverColumn(null)
    }

    const handleDrop = (e, toColumn) => {
        e.preventDefault()
        setDragOverColumn(null)

        if (draggedCard && draggedCard.fromColumn !== toColumn) {
            onStatusChange?.(draggedCard.record, toColumn)
        }

        setDraggedCard(null)
    }

    const groups = groupedData()

    return (
        <div className="kanban-board">
            {kanbanColumns.map(column => {
                const cards = groups[column.value] || []
                const isDropTarget = dragOverColumn === column.value
                const colors = getStatusColor(column.value)

                return (
                    <div
                        key={column.value}
                        className={`kanban-column ${isDropTarget ? 'drag-over' : ''}`}
                        onDragOver={(e) => handleDragOver(e, column.value)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, column.value)}
                    >
                        <div
                            className="kanban-column-header"
                            style={{ borderTopColor: colors.color }}
                        >
                            <span className="column-title">{column.label}</span>
                            <span className="column-count">{cards.length}</span>
                        </div>

                        <div className="kanban-cards">
                            {cards.map(record => (
                                <KanbanCard
                                    key={record.record_id}
                                    record={record}
                                    config={cardConfig}
                                    onClick={() => onCardClick?.(record)}
                                    onDragStart={(e) => handleDragStart(e, record, column.value)}
                                    onDragEnd={handleDragEnd}
                                    isDragging={draggedCard?.record.record_id === record.record_id}
                                />
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function KanbanCard({ record, config, onClick, onDragStart, onDragEnd, isDragging }) {
    const fields = record.fields || {}

    const {
        titleField = 'Client Name',
        subtitleField = 'Project Code',
        fields: displayFields = ['Contact Number', 'Address']
    } = config

    const getFieldValue = (field) => {
        const value = fields[field]
        if (value === null || value === undefined || value === '') return '-'
        if (Array.isArray(value)) {
            if (value.length === 0) return '-'
            if (value[0]?.name) return value.map(v => v.name).join(', ')
            return value.join(', ')
        }
        if (typeof value === 'number' && value > 1000000000000) {
            return new Date(value).toLocaleDateString()
        }
        return String(value)
    }

    const paymentStatus = fields['Payment Status']
    const paymentStatusValue = Array.isArray(paymentStatus) ? paymentStatus[0] : paymentStatus

    return (
        <div
            className={`kanban-card ${isDragging ? 'dragging' : ''}`}
            draggable
            onClick={onClick}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
        >
            <div className="card-header">
                <span className="card-title">{getFieldValue(titleField)}</span>
                {paymentStatusValue && (
                    <StatusBadge status={paymentStatusValue} size="small" />
                )}
            </div>

            {subtitleField && (
                <div className="card-subtitle">{getFieldValue(subtitleField)}</div>
            )}

            <div className="card-fields">
                {displayFields.map(field => (
                    <div key={field} className="card-field">
                        <span className="field-label">{field}:</span>
                        <span className="field-value">{getFieldValue(field)}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default KanbanBoard

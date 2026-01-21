import { useState, useMemo } from 'react'
import StatusBadge from '../StatusBadge'
import './index.css'

/**
 * Calendar view for displaying records by date
 * @param {Array} data - Array of record objects
 * @param {Array} dateFields - Available date fields to choose from [{value, label}]
 * @param {string} selectedDateField - Currently selected date field
 * @param {Function} onDateFieldChange - Callback when date field selection changes
 * @param {Function} onRecordClick - Callback when record is clicked
 * @param {Object} cardConfig - Card display config {titleField, subtitleField}
 * @param {Function} getRecordColor - Function to get color for record (optional)
 */
function CalendarView({
    data = [],
    dateFields = [],
    selectedDateField,
    onDateFieldChange,
    onRecordClick,
    cardConfig = {},
    getRecordColor
}) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDay, setSelectedDay] = useState(null)

    const {
        titleField = 'Client Name',
        subtitleField = 'Project Code'
    } = cardConfig

    // Get current month/year
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1)
        const startDate = new Date(firstDay)
        startDate.setDate(startDate.getDate() - firstDay.getDay())

        const days = []
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate)
            date.setDate(startDate.getDate() + i)

            days.push({
                date,
                isCurrentMonth: date.getMonth() === currentMonth,
                isToday: date.getTime() === today.getTime(),
                dateString: formatDateString(date)
            })
        }

        return days
    }, [currentMonth, currentYear])

    // Group records by date
    const recordsByDate = useMemo(() => {
        const groups = {}

        data.forEach(record => {
            const dateValue = record.fields?.[selectedDateField]
            if (!dateValue) return

            const dateStr = formatDateFromValue(dateValue)
            if (!dateStr) return

            if (!groups[dateStr]) {
                groups[dateStr] = []
            }
            groups[dateStr].push(record)
        })

        return groups
    }, [data, selectedDateField])

    // Get records for selected day
    const selectedDayRecords = selectedDay ? (recordsByDate[selectedDay] || []) : []

    const prevMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
        setSelectedDay(null)
    }

    const nextMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
        setSelectedDay(null)
    }

    const goToToday = () => {
        setCurrentDate(new Date())
        setSelectedDay(null)
    }

    const handleDayClick = (dateString, hasRecords) => {
        if (hasRecords) {
            setSelectedDay(selectedDay === dateString ? null : dateString)
        } else {
            setSelectedDay(null)
        }
    }

    const getFieldValue = (record, field) => {
        const value = record.fields?.[field]
        if (value === null || value === undefined || value === '') return '-'
        if (Array.isArray(value)) {
            if (value.length === 0) return '-'
            if (value[0]?.name) return value.map(v => v.name).join(', ')
            return value.join(', ')
        }
        return String(value)
    }

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December']
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
        <div className="calendar-view">
            {/* Date field selector */}
            {dateFields.length > 0 && (
                <div className="calendar-field-selector">
                    <label>Show by:</label>
                    <select
                        value={selectedDateField}
                        onChange={(e) => onDateFieldChange?.(e.target.value)}
                    >
                        {dateFields.map(field => (
                            <option key={field.value} value={field.value}>
                                {field.label}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Calendar header */}
            <div className="calendar-header">
                <button className="cal-nav-btn" onClick={prevMonth}>&lt;</button>
                <div className="cal-title">
                    <span className="cal-month">{monthNames[currentMonth]}</span>
                    <span className="cal-year">{currentYear}</span>
                </div>
                <button className="cal-nav-btn" onClick={nextMonth}>&gt;</button>
                <button className="cal-today-btn" onClick={goToToday}>Today</button>
            </div>

            {/* Calendar grid */}
            <div className="calendar-grid">
                {/* Day headers */}
                {dayNames.map(day => (
                    <div key={day} className="cal-day-header">{day}</div>
                ))}

                {/* Days */}
                {calendarDays.map((day, index) => {
                    const records = recordsByDate[day.dateString] || []
                    const hasRecords = records.length > 0
                    const isSelected = selectedDay === day.dateString

                    return (
                        <div
                            key={index}
                            className={`cal-day ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''} ${hasRecords ? 'has-records' : ''} ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleDayClick(day.dateString, hasRecords)}
                        >
                            <span className="day-number">{day.date.getDate()}</span>
                            {hasRecords && (
                                <div className="day-indicators">
                                    {records.slice(0, 3).map((record, i) => {
                                        const color = getRecordColor?.(record) || '#3370ff'
                                        return (
                                            <span
                                                key={i}
                                                className="day-dot"
                                                style={{ backgroundColor: color }}
                                            />
                                        )
                                    })}
                                    {records.length > 3 && (
                                        <span className="day-more">+{records.length - 3}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Selected day detail panel */}
            {selectedDay && (
                <div className="calendar-detail">
                    <div className="detail-header">
                        <h3>{formatDisplayDate(selectedDay)}</h3>
                        <span className="detail-count">{selectedDayRecords.length} records</span>
                    </div>
                    <div className="detail-list">
                        {selectedDayRecords.map(record => {
                            const status = record.fields?.['Project Status']
                            const statusValue = Array.isArray(status) ? status[0] : status

                            return (
                                <div
                                    key={record.record_id}
                                    className="detail-card"
                                    onClick={() => onRecordClick?.(record)}
                                >
                                    <div className="detail-card-header">
                                        <span className="detail-title">
                                            {getFieldValue(record, titleField)}
                                        </span>
                                        {statusValue && (
                                            <StatusBadge status={statusValue} size="small" />
                                        )}
                                    </div>
                                    {subtitleField && (
                                        <div className="detail-subtitle">
                                            {getFieldValue(record, subtitleField)}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

// Helper functions
function formatDateString(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function formatDateFromValue(value) {
    if (!value) return null

    // Handle timestamp (milliseconds)
    if (typeof value === 'number') {
        const date = new Date(value)
        return formatDateString(date)
    }

    // Handle date string
    if (typeof value === 'string') {
        // Try to parse ISO date or common formats
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
            return formatDateString(date)
        }
    }

    return null
}

function formatDisplayDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

export default CalendarView

import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTableData } from '../../hooks/useTableData'
import { useAuth } from '../../context/AuthContext'
import { WORK_ORDER_TABLES, PROJECT_STATUS_OPTIONS } from '../../config/tables'
import DataTable from '../../components/shared/DataTable'
import ViewToggle from '../../components/shared/ViewToggle'
import FilterBar from '../../components/shared/FilterBar'
import KanbanBoard from '../../components/shared/KanbanBoard'
import CalendarView from '../../components/shared/CalendarView'
import WorkOrderForm from '../../components/workorderform'
import './index.css'

const POLL_INTERVAL = 30

// Tab configuration
const TABS = [
    { key: 'installation', label: 'Installation' },
    { key: 'defect', label: 'Defect' },
    { key: 'coring', label: 'Coring' },
    { key: 'transport', label: 'Transport' },
    { key: 'caseroStone', label: 'Casero Stone' },
    { key: 'plumber', label: 'Plumber' }
]

// Table-specific column configurations
const TABLE_COLUMNS = {
    installation: [
        { key: 'Project Code', label: 'Project Code', width: '120px' },
        { key: 'Client Name', label: 'Client', className: 'cell-bold' },
        { key: 'Contact Number', label: 'Contact' },
        { key: 'Address', label: 'Address', className: 'cell-truncate' },
        { key: 'Install Date', label: 'Install Date' },
        { key: 'Installer', label: 'Installer' },
        { key: 'Project Status', label: 'Status' },
        { key: 'Payment Status', label: 'Payment' }
    ],
    defect: [
        { key: 'Project Code', label: 'Project Code', width: '120px' },
        { key: 'Client Name', label: 'Client', className: 'cell-bold' },
        { key: 'Contact Number', label: 'Contact' },
        { key: 'Defect Date', label: 'Defect Date' },
        { key: 'Defect Stage', label: 'Stage' },
        { key: 'Submit By', label: 'Submit By' },
        { key: 'Project Status', label: 'Status' }
    ],
    coring: [
        { key: 'Project Code', label: 'Project Code', width: '120px' },
        { key: 'Client Name', label: 'Client', className: 'cell-bold' },
        { key: 'Contact Number', label: 'Contact' },
        { key: 'Order Date', label: 'Order Date' },
        { key: 'Open Date', label: 'Open Date' },
        { key: 'Quantity', label: 'Qty' },
        { key: 'Project Status', label: 'Status' }
    ],
    transport: [
        { key: 'Project Code', label: 'Project Code', width: '120px' },
        { key: 'Client Name', label: 'Client', className: 'cell-bold' },
        { key: 'Contact Number', label: 'Contact' },
        { key: 'Order Date', label: 'Order Date' },
        { key: 'Pick Up Date', label: 'Pick Up' },
        { key: 'Driver', label: 'Driver' },
        { key: 'Project Status', label: 'Status' }
    ],
    caseroStone: [
        { key: 'Project Code', label: 'Project Code', width: '120px' },
        { key: 'Client Name', label: 'Client', className: 'cell-bold' },
        { key: 'Contact Number', label: 'Contact' },
        { key: 'Address', label: 'Address', className: 'cell-truncate' },
        { key: 'Dry Kitchen', label: 'Dry Kitchen' },
        { key: 'Wet Kitchen', label: 'Wet Kitchen' },
        { key: 'Project Status', label: 'Status' }
    ],
    plumber: [
        { key: 'Project Code', label: 'Project Code', width: '120px' },
        { key: 'Client Name', label: 'Client', className: 'cell-bold' },
        { key: 'Contact Number', label: 'Contact' },
        { key: 'Relocation Status', label: 'Relocation' },
        { key: 'Connection Status', label: 'Connection' },
        { key: 'Project Status', label: 'Status' }
    ]
}

// Date fields for calendar view
const DATE_FIELDS = {
    installation: [
        { value: 'Install Date', label: 'Install Date' },
        { value: 'Send Date', label: 'Send Date' }
    ],
    defect: [
        { value: 'Defect Date', label: 'Defect Date' },
        { value: 'Delivery Date', label: 'Delivery Date' }
    ],
    coring: [
        { value: 'Order Date', label: 'Order Date' },
        { value: 'Open Date', label: 'Open Date' }
    ],
    transport: [
        { value: 'Order Date', label: 'Order Date' },
        { value: 'Pick Up Date', label: 'Pick Up Date' }
    ],
    caseroStone: [
        { value: 'Order Date', label: 'Order Date' }
    ],
    plumber: [
        { value: 'Order Date', label: 'Order Date' }
    ]
}

export default function ProjectsPage() {
    const { type } = useParams()
    const navigate = useNavigate()
    const { userInfo, authLoading, authError } = useAuth()

    // Default to installation if no type specified
    const activeTab = type && WORK_ORDER_TABLES.includes(type) ? type : 'installation'

    const [viewMode, setViewMode] = useState('list')
    const [selectedRecord, setSelectedRecord] = useState(null)
    const [isCreateMode, setIsCreateMode] = useState(false)
    const [autoSyncEnabled, setAutoSyncEnabled] = useState(true)
    const [countdown, setCountdown] = useState(POLL_INTERVAL)

    // Filters
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [filterPayment, setFilterPayment] = useState('')

    // Calendar view state
    const [calendarDateField, setCalendarDateField] = useState('')

    const { records, loading, error, fetchRecords, updateRecord, refresh } = useTableData(activeTab)

    // Fetch records when tab changes
    useEffect(() => {
        if (userInfo) {
            fetchRecords({ pageSize: 500 })
            // Reset calendar date field when tab changes
            const dateFields = DATE_FIELDS[activeTab] || []
            setCalendarDateField(dateFields[0]?.value || '')
        }
    }, [activeTab, userInfo, fetchRecords])

    // Auto-sync polling
    useEffect(() => {
        if (!autoSyncEnabled || !userInfo) return

        setCountdown(POLL_INTERVAL)

        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    fetchRecords({ showLoading: false, pageSize: 500 })
                    return POLL_INTERVAL
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [autoSyncEnabled, userInfo, fetchRecords])

    // Get unique filter options
    const statusOptions = useMemo(() => {
        const statuses = new Set()
        records.forEach(r => {
            const status = r.fields?.['Project Status']
            if (status) {
                const val = Array.isArray(status) ? status[0] : status
                statuses.add(val)
            }
        })
        return Array.from(statuses).sort()
    }, [records])

    const paymentOptions = useMemo(() => {
        const payments = new Set()
        records.forEach(r => {
            const payment = r.fields?.['Payment Status']
            if (payment) {
                const val = Array.isArray(payment) ? payment[0] : payment
                payments.add(val)
            }
        })
        return Array.from(payments).sort()
    }, [records])

    // Filter records
    const filteredRecords = useMemo(() => {
        return records.filter(record => {
            const fields = record.fields || {}

            // Search filter
            if (searchTerm) {
                const term = searchTerm.toLowerCase()
                const name = (fields['Client Name'] || '').toLowerCase()
                const code = (fields['Project Code'] || '').toLowerCase()
                const contact = (fields['Contact Number'] || '').toLowerCase()
                if (!name.includes(term) && !code.includes(term) && !contact.includes(term)) {
                    return false
                }
            }

            // Status filter
            if (filterStatus) {
                const status = fields['Project Status']
                const statusVal = Array.isArray(status) ? status[0] : status
                if (statusVal !== filterStatus) return false
            }

            // Payment filter
            if (filterPayment) {
                const payment = fields['Payment Status']
                const paymentVal = Array.isArray(payment) ? payment[0] : payment
                if (paymentVal !== filterPayment) return false
            }

            return true
        })
    }, [records, searchTerm, filterStatus, filterPayment])

    // Summary counts by status
    const statusCounts = useMemo(() => {
        const counts = {}
        PROJECT_STATUS_OPTIONS.forEach(status => {
            counts[status] = 0
        })
        records.forEach(record => {
            const status = record.fields?.['Project Status']
            const statusVal = Array.isArray(status) ? status[0] : status
            if (statusVal && counts[statusVal] !== undefined) {
                counts[statusVal]++
            }
        })
        return counts
    }, [records])

    const handleTabChange = (tabKey) => {
        navigate(`/projects/${tabKey}`)
        setSearchTerm('')
        setFilterStatus('')
        setFilterPayment('')
    }

    const handleRecordClick = (record) => {
        setSelectedRecord(record)
        setIsCreateMode(false)
    }

    const handleCreateClick = () => {
        setSelectedRecord(null)
        setIsCreateMode(true)
    }

    const handleModalClose = () => {
        setSelectedRecord(null)
        setIsCreateMode(false)
    }

    const handleSave = () => {
        refresh()
        handleModalClose()
    }

    const handleStatusChange = async (record, newStatus) => {
        try {
            await updateRecord(record.record_id, { 'Project Status': newStatus })
        } catch (err) {
            console.error('Failed to update status:', err)
        }
    }

    const clearFilters = () => {
        setSearchTerm('')
        setFilterStatus('')
        setFilterPayment('')
    }

    const handleFilterChange = (key, value) => {
        if (key === 'status') setFilterStatus(value)
        if (key === 'payment') setFilterPayment(value)
    }

    // Color function for calendar
    const getRecordColor = (record) => {
        const status = record.fields?.['Project Status']
        const statusVal = Array.isArray(status) ? status[0] : status
        const colors = {
            'New': '#3370ff',
            'In Progress': '#fa8c16',
            'Completed': '#059669',
            'On Hold': '#646a73',
            'Cancelled': '#f54a45'
        }
        return colors[statusVal] || '#3370ff'
    }

    if (authLoading) {
        return (
            <div className="projects-page">
                <div className="loading">Authenticating...</div>
            </div>
        )
    }

    if (authError) {
        return (
            <div className="projects-page">
                <div className="error">{authError}</div>
            </div>
        )
    }

    const columns = TABLE_COLUMNS[activeTab] || []
    const dateFields = DATE_FIELDS[activeTab] || []

    return (
        <div className="projects-page">
            {/* Sync indicator */}
            {autoSyncEnabled && (
                <div className="realtime-status connected" onClick={() => setAutoSyncEnabled(false)}>
                    <span className="status-dot"></span>
                    Sync in {countdown}s
                </div>
            )}
            {!autoSyncEnabled && (
                <div className="realtime-status paused" onClick={() => setAutoSyncEnabled(true)}>
                    <span className="status-dot paused"></span>
                    Paused - tap to resume
                </div>
            )}

            {/* Header with tabs */}
            <div className="page-header">
                <h1>Projects</h1>
                <button className="btn-primary" onClick={handleCreateClick}>
                    + New Work Order
                </button>
            </div>

            {/* Tab navigation */}
            <div className="tabs-container">
                <div className="tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                            onClick={() => handleTabChange(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary cards */}
            <div className="summary-cards">
                {PROJECT_STATUS_OPTIONS.map(status => (
                    <div
                        key={status}
                        className={`summary-card ${filterStatus === status ? 'active' : ''}`}
                        onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
                    >
                        <span className="summary-count">{statusCounts[status] || 0}</span>
                        <span className="summary-label">{status}</span>
                    </div>
                ))}
            </div>

            {/* View toggle and filters */}
            <div className="toolbar">
                <ViewToggle
                    value={viewMode}
                    onChange={setViewMode}
                />
                <FilterBar
                    searchValue={searchTerm}
                    onSearch={setSearchTerm}
                    searchPlaceholder="Search by client, project code, contact..."
                    filters={[
                        { key: 'status', label: 'All Status', options: statusOptions, value: filterStatus },
                        { key: 'payment', label: 'All Payment', options: paymentOptions, value: filterPayment }
                    ]}
                    onFilterChange={handleFilterChange}
                    onClear={clearFilters}
                />
            </div>

            {/* Results count */}
            <div className="results-count">
                Showing {filteredRecords.length} of {records.length} work orders
            </div>

            {/* Content area */}
            <div className="content-area">
                {loading ? (
                    <div className="loading">Loading...</div>
                ) : error ? (
                    <div className="error">{error}</div>
                ) : viewMode === 'list' ? (
                    <DataTable
                        data={filteredRecords}
                        columns={columns}
                        onRowClick={handleRecordClick}
                        emptyMessage="No work orders found"
                    />
                ) : viewMode === 'kanban' ? (
                    <KanbanBoard
                        data={filteredRecords}
                        groupByField="Project Status"
                        columns={PROJECT_STATUS_OPTIONS.map(s => ({ value: s, label: s }))}
                        onCardClick={handleRecordClick}
                        onStatusChange={handleStatusChange}
                        cardConfig={{
                            titleField: 'Client Name',
                            subtitleField: 'Project Code',
                            fields: ['Contact Number', 'Address']
                        }}
                    />
                ) : viewMode === 'calendar' ? (
                    <CalendarView
                        data={filteredRecords}
                        dateFields={dateFields}
                        selectedDateField={calendarDateField}
                        onDateFieldChange={setCalendarDateField}
                        onRecordClick={handleRecordClick}
                        cardConfig={{
                            titleField: 'Client Name',
                            subtitleField: 'Project Code'
                        }}
                        getRecordColor={getRecordColor}
                    />
                ) : null}
            </div>

            {/* Work order form modal */}
            {(selectedRecord || isCreateMode) && (
                <WorkOrderForm
                    record={selectedRecord}
                    tableKey={activeTab}
                    isCreate={isCreateMode}
                    onClose={handleModalClose}
                    onSave={handleSave}
                />
            )}
        </div>
    )
}

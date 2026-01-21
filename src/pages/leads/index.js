import React, { useEffect, useState, useCallback } from 'react'
import { useTableData } from '../../hooks/useTableData'
import { useAuth } from '../../context/AuthContext'
import LeadForm from '../../components/leadform'
import './index.css'

const POLL_INTERVAL = 30 // 30 seconds

export default function LeadsPage() {
    const { userInfo, authLoading, authError } = useAuth()
    const [selectedLead, setSelectedLead] = useState(null)
    const [isCreateMode, setIsCreateMode] = useState(false)
    const [autoSyncEnabled, setAutoSyncEnabled] = useState(true)
    const [countdown, setCountdown] = useState(POLL_INTERVAL)

    // Filters
    const [searchTerm, setSearchTerm] = useState('')
    const [filterMKT, setFilterMKT] = useState('')
    const [filterSales, setFilterSales] = useState('')
    const [filterLocation, setFilterLocation] = useState('')

    const { records: leads, loading, error, fetchRecords, refresh } = useTableData('leads')

    // Fetch records when user is authenticated
    useEffect(() => {
        if (userInfo) {
            fetchRecords({ pageSize: 500 })
        }
    }, [userInfo, fetchRecords])

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

    // Get unique values for filters
    const getMKTOptions = useCallback(() => {
        const mkts = new Set()
        leads.forEach(lead => {
            const mkt = lead.fields?.['MKT']
            if (mkt) mkts.add(mkt)
        })
        return Array.from(mkts).sort()
    }, [leads])

    const getSalesOptions = useCallback(() => {
        const sales = new Set()
        leads.forEach(lead => {
            const s = lead.fields?.['Sales']
            if (s) sales.add(s)
        })
        return Array.from(sales).sort()
    }, [leads])

    const getLocationOptions = useCallback(() => {
        const locations = new Set()
        leads.forEach(lead => {
            const loc = lead.fields?.['Location']
            if (loc) locations.add(loc)
        })
        return Array.from(locations).sort()
    }, [leads])

    // Filter leads
    const filteredLeads = leads.filter(lead => {
        const fields = lead.fields || {}

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            const name = (fields['Customer Name'] || '').toLowerCase()
            const contact = (fields['Contact'] || '').toLowerCase()
            const phone = (fields['Phone'] || '').toLowerCase()
            if (!name.includes(term) && !contact.includes(term) && !phone.includes(term)) {
                return false
            }
        }

        // MKT filter
        if (filterMKT && fields['MKT'] !== filterMKT) {
            return false
        }

        // Sales filter
        if (filterSales && fields['Sales'] !== filterSales) {
            return false
        }

        // Location filter
        if (filterLocation && fields['Location'] !== filterLocation) {
            return false
        }

        return true
    })

    const handleLeadClick = (lead) => {
        setSelectedLead(lead)
        setIsCreateMode(false)
    }

    const handleCreateClick = () => {
        setSelectedLead(null)
        setIsCreateMode(true)
    }

    const handleModalClose = () => {
        setSelectedLead(null)
        setIsCreateMode(false)
    }

    const handleSave = () => {
        refresh()
        handleModalClose()
    }

    const clearFilters = () => {
        setSearchTerm('')
        setFilterMKT('')
        setFilterSales('')
        setFilterLocation('')
    }

    if (authLoading) {
        return (
            <div className="leads-page">
                <div className="loading">Authenticating...</div>
            </div>
        )
    }

    if (authError) {
        return (
            <div className="leads-page">
                <div className="error">{authError}</div>
            </div>
        )
    }

    return (
        <div className="leads-page">
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

            {/* Header */}
            <div className="page-header">
                <h1>Leads</h1>
                <button className="btn-primary" onClick={handleCreateClick}>
                    + New Lead
                </button>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search by name, contact, phone..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <select value={filterMKT} onChange={e => setFilterMKT(e.target.value)}>
                        <option value="">All MKT</option>
                        {getMKTOptions().map(mkt => (
                            <option key={mkt} value={mkt}>{mkt}</option>
                        ))}
                    </select>
                    <select value={filterSales} onChange={e => setFilterSales(e.target.value)}>
                        <option value="">All Sales</option>
                        {getSalesOptions().map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)}>
                        <option value="">All Locations</option>
                        {getLocationOptions().map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                        ))}
                    </select>
                    {(searchTerm || filterMKT || filterSales || filterLocation) && (
                        <button className="btn-clear" onClick={clearFilters}>Clear</button>
                    )}
                </div>
            </div>

            {/* Results count */}
            <div className="results-count">
                Showing {filteredLeads.length} of {leads.length} leads
            </div>

            {/* Leads table */}
            {loading ? (
                <div className="loading">Loading leads...</div>
            ) : error ? (
                <div className="error">{error}</div>
            ) : (
                <div className="leads-table-container">
                    <table className="leads-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>No</th>
                                <th>Time</th>
                                <th>Customer Name</th>
                                <th>Contact</th>
                                <th>Phone</th>
                                <th>Location</th>
                                <th>MKT</th>
                                <th>Sales</th>
                                <th>Remark</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeads.map(lead => (
                                <LeadRow
                                    key={lead.record_id}
                                    lead={lead}
                                    onClick={() => handleLeadClick(lead)}
                                />
                            ))}
                            {filteredLeads.length === 0 && (
                                <tr>
                                    <td colSpan="10" className="empty-row">
                                        No leads found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Lead form modal */}
            {(selectedLead || isCreateMode) && (
                <LeadForm
                    lead={selectedLead}
                    isCreate={isCreateMode}
                    onClose={handleModalClose}
                    onSave={handleSave}
                />
            )}
        </div>
    )
}

function LeadRow({ lead, onClick }) {
    const fields = lead.fields || {}

    // Format date if it's a timestamp
    const formatDate = (value) => {
        if (!value) return '-'
        if (typeof value === 'number') {
            return new Date(value).toLocaleDateString()
        }
        return value
    }

    return (
        <tr onClick={onClick}>
            <td>{formatDate(fields['Date'])}</td>
            <td>{fields['No'] || '-'}</td>
            <td>{fields['Time'] || '-'}</td>
            <td className="cell-name">{fields['Customer Name'] || '-'}</td>
            <td>{fields['Contact'] || '-'}</td>
            <td>{fields['Phone'] || '-'}</td>
            <td>{fields['Location'] || '-'}</td>
            <td>{fields['MKT'] || '-'}</td>
            <td>{fields['Sales'] || '-'}</td>
            <td className="cell-remark">{fields['Remark'] || '-'}</td>
        </tr>
    )
}

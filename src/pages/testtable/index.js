/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import clientConfig from '../../config/client_config'
import './index.css'

const BASE_ID = 'VNaub1YiNaMtBYsKhsol0mlNgnw'
const TABLE_1_ID = 'tbllyDsJ0ODL72QS'
const TABLE_2_ID = 'tblInVic4nFNa2no'

const SINGLE_OPTIONS = ['Option A', 'Option B', 'Option C']

export default function TestTable() {
    const [activeTable, setActiveTable] = useState(1)
    const [records1, setRecords1] = useState([])
    const [records2, setRecords2] = useState([])
    const [fields1, setFields1] = useState([])
    const [fields2, setFields2] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingRecord, setEditingRecord] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [selectedIds, setSelectedIds] = useState(new Set())
    const [batchDeleteConfirm, setBatchDeleteConfirm] = useState(false)

    const getApiUrl = clientConfig.getApiUrl

    const currentTableId = activeTable === 1 ? TABLE_1_ID : TABLE_2_ID
    const records = activeTable === 1 ? records1 : records2
    const setRecords = activeTable === 1 ? setRecords1 : setRecords2
    const fields = activeTable === 1 ? fields1 : fields2

    useEffect(() => {
        fetchAllData()
    }, [])  // eslint-disable-line react-hooks/exhaustive-deps

    const fetchAllData = async () => {
        setLoading(true)
        try {
            const [res1, res2, fieldsRes1, fieldsRes2] = await Promise.all([
                axios.get(getApiUrl(`/api/base/records?base_id=${BASE_ID}&table_id=${TABLE_1_ID}&page_size=100`), { withCredentials: true }),
                axios.get(getApiUrl(`/api/base/records?base_id=${BASE_ID}&table_id=${TABLE_2_ID}&page_size=100`), { withCredentials: true }),
                axios.get(getApiUrl(`/api/base/fields?base_id=${BASE_ID}&table_id=${TABLE_1_ID}`), { withCredentials: true }),
                axios.get(getApiUrl(`/api/base/fields?base_id=${BASE_ID}&table_id=${TABLE_2_ID}`), { withCredentials: true })
            ])
            if (res1.data?.code === 0) {
                setRecords1(res1.data.data.items || [])
            }
            if (res2.data?.code === 0) {
                setRecords2(res2.data.data.items || [])
            }
            if (fieldsRes1.data?.code === 0) {
                setFields1(fieldsRes1.data.data.items || [])
                console.log('Table 1 fields:', fieldsRes1.data.data.items)
            }
            if (fieldsRes2.data?.code === 0) {
                setFields2(fieldsRes2.data.data.items || [])
                console.log('Table 2 fields:', fieldsRes2.data.data.items)
            }
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
    }

    const fetchRecords = async (tableId, setFn) => {
        try {
            const res = await axios.get(
                getApiUrl(`/api/base/records?base_id=${BASE_ID}&table_id=${tableId}&page_size=100`),
                { withCredentials: true }
            )
            if (res.data?.code === 0) {
                setFn(res.data.data.items || [])
            }
        } catch (err) {
            console.error('Fetch failed:', err)
        }
    }

    const handleCreate = () => {
        setEditingRecord(null)
        setModalOpen(true)
    }

    const handleEdit = (record) => {
        setEditingRecord(record)
        setModalOpen(true)
    }

    const handleDelete = (record) => {
        setDeleteConfirm(record)
    }

    const confirmDelete = async () => {
        if (!deleteConfirm) return
        try {
            const res = await axios.delete(getApiUrl('/api/base/record'), {
                data: {
                    base_id: BASE_ID,
                    table_id: currentTableId,
                    record_id: deleteConfirm.record_id
                },
                withCredentials: true
            })
            if (res.data?.code === 0) {
                if (activeTable === 1) {
                    setRecords1(prev => prev.filter(r => r.record_id !== deleteConfirm.record_id))
                } else {
                    setRecords2(prev => prev.filter(r => r.record_id !== deleteConfirm.record_id))
                }
            }
        } catch (err) {
            console.error('Delete failed:', err)
        }
        setDeleteConfirm(null)
    }

    const handleSave = async (fields) => {
        try {
            if (editingRecord) {
                // Update
                const res = await axios.put(getApiUrl('/api/base/record'), {
                    base_id: BASE_ID,
                    table_id: currentTableId,
                    record_id: editingRecord.record_id,
                    fields
                }, { withCredentials: true })

                if (res.data?.code === 0) {
                    const updateFn = prev => prev.map(r =>
                        r.record_id === editingRecord.record_id
                            ? { ...r, fields: { ...r.fields, ...fields } }
                            : r
                    )
                    if (activeTable === 1) {
                        setRecords1(updateFn)
                    } else {
                        setRecords2(updateFn)
                    }
                }
            } else {
                // Create
                const res = await axios.post(getApiUrl('/api/base/record'), {
                    base_id: BASE_ID,
                    table_id: currentTableId,
                    fields
                }, { withCredentials: true })

                if (res.data?.code === 0) {
                    const newRecord = res.data.data.record
                    if (activeTable === 1) {
                        setRecords1(prev => [newRecord, ...prev])
                    } else {
                        setRecords2(prev => [newRecord, ...prev])
                    }
                }
            }
            setModalOpen(false)
        } catch (err) {
            console.error('Save failed:', err)
        }
    }

    const formatDate = (timestamp) => {
        if (!timestamp) return '-'
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const toggleSelect = (recordId) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(recordId)) {
                next.delete(recordId)
            } else {
                next.add(recordId)
            }
            return next
        })
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === records.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(records.map(r => r.record_id)))
        }
    }

    const confirmBatchDelete = async () => {
        if (selectedIds.size === 0) return
        try {
            const res = await axios.post(getApiUrl('/api/base/records/batch_delete'), {
                base_id: BASE_ID,
                table_id: currentTableId,
                records: Array.from(selectedIds)
            }, { withCredentials: true })

            if (res.data?.code === 0) {
                const filterFn = prev => prev.filter(r => !selectedIds.has(r.record_id))
                if (activeTable === 1) {
                    setRecords1(filterFn)
                } else {
                    setRecords2(filterFn)
                }
                setSelectedIds(new Set())
            }
        } catch (err) {
            console.error('Batch delete failed:', err)
        }
        setBatchDeleteConfirm(false)
    }

    const switchTable = (tableNum) => {
        setActiveTable(tableNum)
        setSelectedIds(new Set())
    }

    if (loading) {
        return <div className="test-table"><div className="loading">Loading...</div></div>
    }

    if (error) {
        return <div className="test-table"><div className="error">{error}</div></div>
    }

    // Get field names dynamically from first record
    const getFieldNames = (recs) => {
        if (recs.length === 0) return []
        const fields = Object.keys(recs[0].fields || {})
        return fields.slice(0, 4) // Show max 4 fields
    }

    const fieldNames = getFieldNames(records)

    // Render field value based on type
    const renderFieldValue = (value, fieldName) => {
        if (value === null || value === undefined) return '-'

        // Handle link field (array of linked record IDs or objects)
        if (Array.isArray(value)) {
            if (value.length === 0) return '-'
            // Link fields return array of objects with record_id and text
            if (typeof value[0] === 'object' && value[0].text) {
                return value.map(v => v.text).join(', ')
            }
            // Or just array of record IDs
            if (typeof value[0] === 'string') {
                return `${value.length} linked`
            }
            return JSON.stringify(value)
        }

        // Handle date (timestamp)
        if (typeof value === 'number' && value > 1000000000000) {
            return formatDate(value)
        }

        // Handle object (could be various field types)
        if (typeof value === 'object') {
            if (value.text) return value.text
            if (value.link) return value.link
            return JSON.stringify(value)
        }

        return String(value)
    }

    return (
        <div className="test-table">
            {/* Table Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                <button
                    onClick={() => switchTable(1)}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: activeTable === 1 ? '#3370ff' : '#f0f1f2',
                        color: activeTable === 1 ? '#fff' : '#1f2329',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        cursor: 'pointer'
                    }}
                >
                    Table 1 ({records1.length})
                </button>
                <button
                    onClick={() => switchTable(2)}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: activeTable === 2 ? '#3370ff' : '#f0f1f2',
                        color: activeTable === 2 ? '#fff' : '#1f2329',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        cursor: 'pointer'
                    }}
                >
                    Table 2 ({records2.length})
                </button>
            </div>

            <div className="header">
                <h1>Table {activeTable}</h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {selectedIds.size > 0 && (
                        <button
                            onClick={() => setBatchDeleteConfirm(true)}
                            style={{
                                padding: '8px 12px',
                                backgroundColor: '#dc2626',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '13px',
                                cursor: 'pointer'
                            }}
                        >
                            Delete ({selectedIds.size})
                        </button>
                    )}
                    <button className="btn-create" onClick={handleCreate}>+ New</button>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '40px', textAlign: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={records.length > 0 && selectedIds.size === records.length}
                                    onChange={toggleSelectAll}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                            </th>
                            {fieldNames.map(name => (
                                <th key={name} style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</th>
                            ))}
                            <th style={{ width: '50px', textAlign: 'right' }}>Edit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map(record => (
                            <tr key={record.record_id} style={{ backgroundColor: selectedIds.has(record.record_id) ? '#f0f7ff' : undefined }}>
                                <td style={{ textAlign: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(record.record_id)}
                                        onChange={() => toggleSelect(record.record_id)}
                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                    />
                                </td>
                                {fieldNames.map(name => (
                                    <td key={name} style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {renderFieldValue(record.fields[name], name)}
                                    </td>
                                ))}
                                <td style={{ textAlign: 'right' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(record)}
                                        style={{
                                            width: '40px',
                                            height: '26px',
                                            backgroundColor: '#f0f1f2',
                                            color: '#1f2329',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            cursor: 'pointer'
                                        }}
                                    >Edit</button>
                                </td>
                            </tr>
                        ))}
                        {records.length === 0 && (
                            <tr>
                                <td colSpan={fieldNames.length + 2} className="empty">No records found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {modalOpen && (
                <RecordModal
                    record={editingRecord}
                    onClose={() => setModalOpen(false)}
                    onSave={handleSave}
                    options={SINGLE_OPTIONS}
                    tableNum={activeTable}
                    tableFields={fields}
                    otherTableRecords={activeTable === 1 ? records2 : records1}
                />
            )}

            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="delete-confirm" onClick={e => e.stopPropagation()}>
                        <h3>Delete Record?</h3>
                        <p>Are you sure you want to delete this record? This action cannot be undone.</p>
                        <div className="confirm-actions">
                            <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="btn-delete-confirm" onClick={confirmDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {batchDeleteConfirm && (
                <div className="modal-overlay" onClick={() => setBatchDeleteConfirm(false)}>
                    <div className="delete-confirm" onClick={e => e.stopPropagation()}>
                        <h3>Delete {selectedIds.size} Records?</h3>
                        <p>Are you sure you want to delete {selectedIds.size} selected records? This action cannot be undone.</p>
                        <div className="confirm-actions">
                            <button className="btn-cancel" onClick={() => setBatchDeleteConfirm(false)}>Cancel</button>
                            <button className="btn-delete-confirm" onClick={confirmBatchDelete}>Delete All</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function RecordModal({ record, onClose, onSave, options, tableNum, tableFields, otherTableRecords }) {
    // Field types: 1=Text, 2=Number, 3=SingleSelect, 5=Date, 18=SingleLink, 19=Lookup, 21=DuplexLink
    const FIELD_TYPE_SINGLE_LINK = 18
    const FIELD_TYPE_DUPLEX_LINK = 21

    // Get link fields from schema (both single and duplex links)
    const linkFieldNames = tableFields
        .filter(f => f.type === FIELD_TYPE_SINGLE_LINK || f.type === FIELD_TYPE_DUPLEX_LINK)
        .map(f => f.field_name)

    // Build initial form data
    const buildInitialData = () => {
        const data = {}
        // Initialize link fields as empty arrays
        linkFieldNames.forEach(name => {
            data[name] = []
        })
        // Fill in values from record if editing
        if (record) {
            Object.keys(record.fields || {}).forEach(key => {
                const value = record.fields[key]
                if (key === 'Date' && typeof value === 'number') {
                    data[key] = new Date(value).toISOString().split('T')[0]
                } else if (Array.isArray(value)) {
                    // Extract record IDs and filter out null/invalid values
                    data[key] = value
                        .map(v => typeof v === 'object' && v ? v.record_id : v)
                        .filter(id => id && typeof id === 'string')
                } else {
                    data[key] = value ?? ''
                }
            })
        }
        return data
    }

    const [formData, setFormData] = useState(buildInitialData)
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)

        const fields = {}
        Object.keys(formData).forEach(key => {
            const value = formData[key]
            if (value === '' || value === null || value === undefined) return
            if (Array.isArray(value) && value.length === 0) return

            if (key === 'Date') {
                fields[key] = new Date(value).getTime()
            } else if (key === 'Attachment' && !isNaN(Number(value))) {
                fields[key] = Number(value)
            } else if (linkFieldNames.includes(key) && Array.isArray(value)) {
                // Link field - just array of record IDs (strings), filter out null/undefined
                const validIds = value.filter(id => id && typeof id === 'string' && id.startsWith('rec'))
                if (validIds.length > 0) {
                    fields[key] = validIds
                }
            } else {
                fields[key] = value
            }
        })

        console.log('Saving fields:', JSON.stringify(fields, null, 2))
        await onSave(fields)
        setSaving(false)
    }

    const updateField = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }))
    }

    const toggleLinkRecord = (fieldKey, recordId, allowMultiple) => {
        setFormData(prev => {
            const current = Array.isArray(prev[fieldKey]) ? prev[fieldKey] : []
            if (allowMultiple) {
                // Multiple selection - toggle
                if (current.includes(recordId)) {
                    return { ...prev, [fieldKey]: current.filter(id => id !== recordId) }
                } else {
                    return { ...prev, [fieldKey]: [...current, recordId] }
                }
            } else {
                // Single selection - replace
                if (current.includes(recordId)) {
                    return { ...prev, [fieldKey]: [] } // Deselect
                } else {
                    return { ...prev, [fieldKey]: [recordId] } // Select only this one
                }
            }
        })
    }

    const getRecordDisplayName = (rec) => {
        const f = rec.fields || {}
        return f.Text || f.Name || f.Title || rec.record_id.slice(-6)
    }

    // Render form field based on schema
    const renderField = (fieldDef) => {
        const { field_name, type } = fieldDef

        // Link field (both single link type 18 and duplex link type 21)
        if (type === FIELD_TYPE_SINGLE_LINK || type === FIELD_TYPE_DUPLEX_LINK) {
            const allowMultiple = fieldDef.property?.multiple === true
            const inputType = allowMultiple ? 'checkbox' : 'radio'
            const linkType = type === FIELD_TYPE_DUPLEX_LINK ? '2-way' : '1-way'
            const linkLabel = `${linkType}, ${allowMultiple ? 'Multiple' : 'Single'}`

            return (
                <div className="form-group" key={field_name}>
                    <label>{field_name} ({linkLabel})</label>
                    <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #d0d3d6', borderRadius: '6px', padding: '8px' }}>
                        {otherTableRecords.length > 0 ? otherTableRecords.map(rec => (
                            <label key={rec.record_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer', fontSize: '13px' }}>
                                <input
                                    type={inputType}
                                    name={field_name}
                                    checked={(formData[field_name] || []).includes(rec.record_id)}
                                    onChange={() => toggleLinkRecord(field_name, rec.record_id, allowMultiple)}
                                />
                                {getRecordDisplayName(rec)}
                            </label>
                        )) : <span style={{ color: '#8f959e', fontSize: '13px' }}>No records to link</span>}
                    </div>
                </div>
            )
        }

        // Date field (type 5)
        if (type === 5) {
            return (
                <div className="form-group" key={field_name}>
                    <label>{field_name}</label>
                    <input
                        type="date"
                        value={formData[field_name] || ''}
                        onChange={e => updateField(field_name, e.target.value)}
                    />
                </div>
            )
        }

        // Single select (type 3)
        if (type === 3) {
            const opts = fieldDef.property?.options || options
            return (
                <div className="form-group" key={field_name}>
                    <label>{field_name}</label>
                    <select
                        value={formData[field_name] || ''}
                        onChange={e => updateField(field_name, e.target.value)}
                    >
                        <option value="">Select...</option>
                        {opts.map(opt => (
                            <option key={opt.name || opt} value={opt.name || opt}>{opt.name || opt}</option>
                        ))}
                    </select>
                </div>
            )
        }

        // Number field (type 2)
        if (type === 2) {
            return (
                <div className="form-group" key={field_name}>
                    <label>{field_name}</label>
                    <input
                        type="number"
                        value={formData[field_name] || ''}
                        onChange={e => updateField(field_name, e.target.value)}
                        placeholder="Enter number..."
                    />
                </div>
            )
        }

        // Default: text input
        return (
            <div className="form-group" key={field_name}>
                <label>{field_name}</label>
                <input
                    type="text"
                    value={formData[field_name] || ''}
                    onChange={e => updateField(field_name, e.target.value)}
                    placeholder={`Enter ${field_name}...`}
                />
            </div>
        )
    }

    // Filter out system/readonly fields (like Lookup type 19, Formula type 20, etc.)
    // Keep type 18 (SingleLink) and type 21 (DuplexLink)
    const editableFields = tableFields.filter(f => ![19, 20, 22, 23].includes(f.type))

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{record ? 'Edit' : 'New'} (Table {tableNum})</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    {editableFields.map(renderField)}

                    {editableFields.length === 0 && (
                        <div className="form-group">
                            <label>Text</label>
                            <input
                                type="text"
                                value={formData.Text || ''}
                                onChange={e => updateField('Text', e.target.value)}
                                placeholder="Enter text..."
                            />
                        </div>
                    )}

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-save" disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

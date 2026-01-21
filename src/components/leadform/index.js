import { useState, useEffect } from 'react'
import { useTableData } from '../../hooks/useTableData'
import './index.css'

const getInitialFormData = (lead) => {
    const fields = lead?.fields || {}
    return {
        'Date': fields['Date'] ?? '',
        'No': fields['No'] ?? '',
        'Time': fields['Time'] ?? '',
        'Customer Name': fields['Customer Name'] ?? '',
        'Contact': fields['Contact'] ?? '',
        'Phone': fields['Phone'] ?? '',
        'Location': fields['Location'] ?? '',
        'MKT': fields['MKT'] ?? '',
        'Sales': fields['Sales'] ?? '',
        'Remark': fields['Remark'] ?? '',
        'MKT Remark': fields['MKT Remark'] ?? '',
    }
}

function LeadForm({ lead, isCreate, onClose, onSave }) {
    const [formData, setFormData] = useState(() => getInitialFormData(lead))
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const { createRecord, updateRecord, deleteRecord } = useTableData('leads')

    useEffect(() => {
        setFormData(getInitialFormData(lead))
    }, [lead])

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSave = async () => {
        setSaving(true)
        setError(null)

        try {
            // Only send non-empty fields, convert dates to timestamps
            const fieldsToSave = {}
            const dateFields = ['Date'] // Fields that are date type

            Object.entries(formData).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    // Convert date strings to timestamps for Lark API
                    if (dateFields.includes(key) && typeof value === 'string') {
                        const timestamp = new Date(value).getTime()
                        if (!isNaN(timestamp)) {
                            fieldsToSave[key] = timestamp
                        }
                    } else {
                        fieldsToSave[key] = value
                    }
                }
            })

            if (isCreate) {
                await createRecord(fieldsToSave)
            } else {
                await updateRecord(lead.record_id, fieldsToSave)
            }

            onSave()
        } catch (err) {
            setError(err.message)
        }
        setSaving(false)
    }

    const handleDelete = async () => {
        setDeleting(true)
        setError(null)

        try {
            await deleteRecord(lead.record_id)
            onSave()
        } catch (err) {
            setError(err.message)
            setDeleting(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content lead-form-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{isCreate ? 'New Lead' : 'Edit Lead'}</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {error && <div className="modal-error">{error}</div>}

                    <div className="form-row">
                        <div className="form-group">
                            <label>Date</label>
                            <input
                                type="date"
                                value={formData['Date']}
                                onChange={e => handleChange('Date', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>No</label>
                            <input
                                type="text"
                                value={formData['No']}
                                onChange={e => handleChange('No', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Time</label>
                            <input
                                type="text"
                                value={formData['Time']}
                                onChange={e => handleChange('Time', e.target.value)}
                                placeholder="e.g., 10:00 AM"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Customer Name</label>
                        <input
                            type="text"
                            value={formData['Customer Name']}
                            onChange={e => handleChange('Customer Name', e.target.value)}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Contact</label>
                            <input
                                type="text"
                                value={formData['Contact']}
                                onChange={e => handleChange('Contact', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone</label>
                            <input
                                type="text"
                                value={formData['Phone']}
                                onChange={e => handleChange('Phone', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Location</label>
                        <input
                            type="text"
                            value={formData['Location']}
                            onChange={e => handleChange('Location', e.target.value)}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>MKT</label>
                            <input
                                type="text"
                                value={formData['MKT']}
                                onChange={e => handleChange('MKT', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Sales</label>
                            <input
                                type="text"
                                value={formData['Sales']}
                                onChange={e => handleChange('Sales', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Remark</label>
                        <textarea
                            value={formData['Remark']}
                            onChange={e => handleChange('Remark', e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="form-group">
                        <label>MKT Remark</label>
                        <textarea
                            value={formData['MKT Remark']}
                            onChange={e => handleChange('MKT Remark', e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    {!isCreate && !showDeleteConfirm && (
                        <button
                            className="btn-delete"
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            Delete
                        </button>
                    )}
                    {showDeleteConfirm && (
                        <div className="delete-confirm">
                            <span>Delete this lead?</span>
                            <button
                                className="btn-delete-confirm"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                            <button
                                className="btn-cancel"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                    {!showDeleteConfirm && (
                        <>
                            <div className="spacer"></div>
                            <button className="btn-cancel" onClick={onClose}>Cancel</button>
                            <button className="btn-save" onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default LeadForm

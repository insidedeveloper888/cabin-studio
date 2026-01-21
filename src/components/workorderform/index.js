import { useState, useEffect, useMemo } from 'react'
import { useTableData } from '../../hooks/useTableData'
import { TABLES, PROJECT_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '../../config/tables'
import './index.css'

// Field configurations for each table type
const FORM_FIELDS = {
    installation: [
        { section: 'Project Info', fields: [
            { key: 'Project Code', label: 'Project Code', type: 'text' },
            { key: 'Project Size', label: 'Project Size', type: 'text' },
            { key: 'Client Name', label: 'Client Name', type: 'text', required: true },
            { key: 'Contact Number', label: 'Contact Number', type: 'text' },
            { key: 'Address', label: 'Address', type: 'text' },
            { key: 'Key Location', label: 'Key Location', type: 'text' }
        ]},
        { section: 'Schedule', fields: [
            { key: 'Send Date', label: 'Send Date', type: 'date' },
            { key: 'Install Date', label: 'Install Date', type: 'date' },
            { key: 'Installer', label: 'Installer', type: 'text' }
        ]},
        { section: 'Details', fields: [
            { key: 'Stone', label: 'Stone', type: 'text' },
            { key: 'Backsplash', label: 'Backsplash', type: 'text' },
            { key: 'Connection', label: 'Connection', type: 'text' },
            { key: 'Hood Installation', label: 'Hood Installation', type: 'text' },
            { key: 'Relocation', label: 'Relocation', type: 'text' },
            { key: 'Coring', label: 'Coring', type: 'text' },
            { key: 'Hood Hob', label: 'Hood Hob', type: 'text' },
            { key: 'Sink Tap', label: 'Sink Tap', type: 'text' },
            { key: 'Remark', label: 'Remark', type: 'textarea' }
        ]},
        { section: 'Status', fields: [
            { key: 'Payment Status', label: 'Payment Status', type: 'select', options: PAYMENT_STATUS_OPTIONS },
            { key: 'Project Status', label: 'Project Status', type: 'select', options: PROJECT_STATUS_OPTIONS },
            { key: 'Sales Person', label: 'Sales Person', type: 'text' },
            { key: 'Sampah Status', label: 'Sampah Status', type: 'text' }
        ]}
    ],
    defect: [
        { section: 'Project Info', fields: [
            { key: 'Project Code', label: 'Project Code', type: 'text' },
            { key: 'Client Name', label: 'Client Name', type: 'text', required: true },
            { key: 'Contact Number', label: 'Contact Number', type: 'text' },
            { key: 'Address', label: 'Address', type: 'text' }
        ]},
        { section: 'Defect Details', fields: [
            { key: 'Delivery Date', label: 'Delivery Date', type: 'date' },
            { key: 'Defect Date', label: 'Defect Date', type: 'date' },
            { key: 'Defect Stage', label: 'Defect Stage', type: 'text' },
            { key: 'Submit By', label: 'Submit By', type: 'text' }
        ]},
        { section: 'Status', fields: [
            { key: 'Project Status', label: 'Project Status', type: 'select', options: PROJECT_STATUS_OPTIONS },
            { key: 'Payment Status', label: 'Payment Status', type: 'select', options: PAYMENT_STATUS_OPTIONS },
            { key: 'Sales Person', label: 'Sales Person', type: 'text' }
        ]}
    ],
    coring: [
        { section: 'Project Info', fields: [
            { key: 'Project Code', label: 'Project Code', type: 'text' },
            { key: 'Client Name', label: 'Client Name', type: 'text', required: true },
            { key: 'Contact Number', label: 'Contact Number', type: 'text' },
            { key: 'Address', label: 'Address', type: 'text' }
        ]},
        { section: 'Order Details', fields: [
            { key: 'Order Date', label: 'Order Date', type: 'date' },
            { key: 'Open Date', label: 'Open Date', type: 'date' },
            { key: 'Quantity', label: 'Quantity', type: 'number' }
        ]},
        { section: 'Status', fields: [
            { key: 'Project Status', label: 'Project Status', type: 'select', options: PROJECT_STATUS_OPTIONS },
            { key: 'Payment Status', label: 'Payment Status', type: 'select', options: PAYMENT_STATUS_OPTIONS },
            { key: 'Sales Person', label: 'Sales Person', type: 'text' }
        ]}
    ],
    transport: [
        { section: 'Project Info', fields: [
            { key: 'Project Code', label: 'Project Code', type: 'text' },
            { key: 'Client Name', label: 'Client Name', type: 'text', required: true },
            { key: 'Contact Number', label: 'Contact Number', type: 'text' }
        ]},
        { section: 'Transport Details', fields: [
            { key: 'Order Date', label: 'Order Date', type: 'date' },
            { key: 'Pick Up Date', label: 'Pick Up Date', type: 'date' },
            { key: 'Driver', label: 'Driver', type: 'text' },
            { key: 'Pick Up Address', label: 'Pick Up Address', type: 'text' },
            { key: 'Drop Off Address', label: 'Drop Off Address', type: 'text' }
        ]},
        { section: 'Status', fields: [
            { key: 'Project Status', label: 'Project Status', type: 'select', options: PROJECT_STATUS_OPTIONS },
            { key: 'Payment Status', label: 'Payment Status', type: 'select', options: PAYMENT_STATUS_OPTIONS },
            { key: 'Sales Person', label: 'Sales Person', type: 'text' }
        ]}
    ],
    caseroStone: [
        { section: 'Project Info', fields: [
            { key: 'Project Code', label: 'Project Code', type: 'text' },
            { key: 'Client Name', label: 'Client Name', type: 'text', required: true },
            { key: 'Contact Number', label: 'Contact Number', type: 'text' },
            { key: 'Address', label: 'Address', type: 'text' }
        ]},
        { section: 'Kitchen Details', fields: [
            { key: 'Dry Kitchen', label: 'Dry Kitchen', type: 'textarea' },
            { key: 'Wet Kitchen', label: 'Wet Kitchen', type: 'textarea' }
        ]},
        { section: 'Status', fields: [
            { key: 'Project Status', label: 'Project Status', type: 'select', options: PROJECT_STATUS_OPTIONS },
            { key: 'Payment Status', label: 'Payment Status', type: 'select', options: PAYMENT_STATUS_OPTIONS },
            { key: 'Sales Person', label: 'Sales Person', type: 'text' }
        ]}
    ],
    plumber: [
        { section: 'Project Info', fields: [
            { key: 'Project Code', label: 'Project Code', type: 'text' },
            { key: 'Client Name', label: 'Client Name', type: 'text', required: true },
            { key: 'Contact Number', label: 'Contact Number', type: 'text' },
            { key: 'Address', label: 'Address', type: 'text' }
        ]},
        { section: 'Plumber Details', fields: [
            { key: 'Relocation Status', label: 'Relocation Status', type: 'text' },
            { key: 'Connection Status', label: 'Connection Status', type: 'text' },
            { key: 'Hood Status', label: 'Hood Status', type: 'text' },
            { key: 'Sink Quantity', label: 'Sink Quantity', type: 'number' },
            { key: 'Tap Quantity', label: 'Tap Quantity', type: 'number' }
        ]},
        { section: 'Status', fields: [
            { key: 'Project Status', label: 'Project Status', type: 'select', options: PROJECT_STATUS_OPTIONS },
            { key: 'Payment Status', label: 'Payment Status', type: 'select', options: PAYMENT_STATUS_OPTIONS },
            { key: 'Sales Person', label: 'Sales Person', type: 'text' }
        ]}
    ]
}

function WorkOrderForm({ record, tableKey, isCreate, onClose, onSave }) {
    const [formData, setFormData] = useState({})
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const { createRecord, updateRecord, deleteRecord } = useTableData(tableKey)

    const formConfig = useMemo(() => FORM_FIELDS[tableKey] || [], [tableKey])
    const tableName = TABLES[tableKey]?.name || tableKey

    // Initialize form data from record
    useEffect(() => {
        const initialData = {}
        formConfig.forEach(section => {
            section.fields.forEach(field => {
                const value = record?.fields?.[field.key]
                if (field.type === 'date' && typeof value === 'number') {
                    // Convert timestamp to date string
                    initialData[field.key] = formatDateForInput(value)
                } else if (Array.isArray(value)) {
                    // Handle single-select arrays
                    initialData[field.key] = value[0] || ''
                } else {
                    initialData[field.key] = value ?? ''
                }
            })
        })
        setFormData(initialData)
    }, [record, formConfig])

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }))
    }

    const handleSave = async () => {
        setSaving(true)
        setError(null)

        try {
            // Build fields object, excluding empty values
            const fieldsToSave = {}

            // Get field types from config for proper conversion
            const fieldTypes = {}
            formConfig.forEach(section => {
                section.fields.forEach(field => {
                    fieldTypes[field.key] = field.type
                })
            })

            Object.entries(formData).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    // Convert date strings to timestamps for Lark API
                    if (fieldTypes[key] === 'date' && typeof value === 'string') {
                        // Convert "YYYY-MM-DD" to timestamp in milliseconds
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
                await updateRecord(record.record_id, fieldsToSave)
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
            await deleteRecord(record.record_id)
            onSave()
        } catch (err) {
            setError(err.message)
            setDeleting(false)
        }
    }

    const renderField = (field) => {
        const value = formData[field.key] ?? ''

        switch (field.type) {
            case 'select':
                return (
                    <select
                        value={value}
                        onChange={e => handleChange(field.key, e.target.value)}
                    >
                        <option value="">Select {field.label}</option>
                        {field.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                )

            case 'date':
                return (
                    <input
                        type="date"
                        value={value}
                        onChange={e => handleChange(field.key, e.target.value)}
                    />
                )

            case 'number':
                return (
                    <input
                        type="number"
                        value={value}
                        onChange={e => handleChange(field.key, e.target.value)}
                    />
                )

            case 'textarea':
                return (
                    <textarea
                        value={value}
                        onChange={e => handleChange(field.key, e.target.value)}
                        rows={3}
                    />
                )

            default:
                return (
                    <input
                        type="text"
                        value={value}
                        onChange={e => handleChange(field.key, e.target.value)}
                        required={field.required}
                    />
                )
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content work-order-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{isCreate ? `New ${tableName}` : `Edit ${tableName}`}</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {error && <div className="modal-error">{error}</div>}

                    {formConfig.map((section, sIndex) => (
                        <div key={sIndex} className="form-section">
                            <h3 className="section-title">{section.section}</h3>
                            <div className="section-fields">
                                {section.fields.map(field => (
                                    <div key={field.key} className={`form-group ${field.type === 'textarea' ? 'full-width' : ''}`}>
                                        <label>
                                            {field.label}
                                            {field.required && <span className="required">*</span>}
                                        </label>
                                        {renderField(field)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
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
                            <span>Delete this work order?</span>
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

// Helper function to format timestamp to date input value
function formatDateForInput(timestamp) {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export default WorkOrderForm

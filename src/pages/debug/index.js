import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import clientConfig from '../../config/client_config'
import { BASE_ID, TABLES } from '../../config/tables'
import './index.css'

export default function DebugPage() {
    const { userInfo, authLoading, authError } = useAuth()
    const [selectedTable, setSelectedTable] = useState('leads')
    const [fields, setFields] = useState([])
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const fetchFields = async (tableKey) => {
        setLoading(true)
        setError(null)
        try {
            const tableId = TABLES[tableKey]?.id
            const url = clientConfig.getApiUrl(`/api/base/fields?base_id=${BASE_ID}&table_id=${tableId}`)
            const res = await axios.get(url, { withCredentials: true })

            if (res.data?.code === 0) {
                setFields(res.data.data?.items || [])
            } else {
                setError(res.data?.msg || 'Failed to fetch fields')
            }
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
    }

    const fetchSampleRecords = async (tableKey) => {
        try {
            const tableId = TABLES[tableKey]?.id
            const url = clientConfig.getApiUrl(`/api/base/records?base_id=${BASE_ID}&table_id=${tableId}&page_size=3`)
            const res = await axios.get(url, { withCredentials: true })

            if (res.data?.code === 0) {
                setRecords(res.data.data?.items || [])
            }
        } catch (err) {
            console.error('Failed to fetch sample records:', err)
        }
    }

    useEffect(() => {
        if (userInfo && selectedTable) {
            fetchFields(selectedTable)
            fetchSampleRecords(selectedTable)
        }
    }, [userInfo, selectedTable])

    if (authLoading) {
        return <div className="debug-page"><div className="loading">Authenticating...</div></div>
    }

    if (authError) {
        return <div className="debug-page"><div className="error">{authError}</div></div>
    }

    return (
        <div className="debug-page">
            <h1>Field Schema Debug</h1>

            <div className="table-selector">
                <label>Select Table:</label>
                <select value={selectedTable} onChange={e => setSelectedTable(e.target.value)}>
                    {Object.entries(TABLES).map(([key, table]) => (
                        <option key={key} value={key}>{table.name} ({key})</option>
                    ))}
                </select>
            </div>

            <div className="table-info">
                <strong>Table ID:</strong> {TABLES[selectedTable]?.id}
            </div>

            {loading && <div className="loading">Loading fields...</div>}
            {error && <div className="error">{error}</div>}

            <h2>Fields ({fields.length})</h2>
            <div className="fields-list">
                <table>
                    <thead>
                        <tr>
                            <th>Field Name</th>
                            <th>Field ID</th>
                            <th>Type</th>
                            <th>Options (if select)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fields.map(field => (
                            <tr key={field.field_id}>
                                <td><code>{field.field_name}</code></td>
                                <td><code>{field.field_id}</code></td>
                                <td>{field.type}</td>
                                <td>
                                    {field.property?.options && (
                                        <div className="options">
                                            {field.property.options.map((opt, i) => (
                                                <span key={i} className="option">{opt.name}</span>
                                            ))}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <h2>Sample Records ({records.length})</h2>
            <div className="records-list">
                {records.map((record, index) => (
                    <div key={record.record_id} className="record-card">
                        <div className="record-id">Record ID: {record.record_id}</div>
                        <pre>{JSON.stringify(record.fields, null, 2)}</pre>
                    </div>
                ))}
            </div>

            <h2>Field Mapping for Code</h2>
            <div className="code-output">
                <pre>{generateFieldConfig(fields)}</pre>
            </div>
        </div>
    )
}

function generateFieldConfig(fields) {
    const fieldList = fields.map(f => {
        let type = 'text'
        if (f.type === 1) type = 'text'
        else if (f.type === 2) type = 'number'
        else if (f.type === 3) type = 'select'
        else if (f.type === 4) type = 'multi_select'
        else if (f.type === 5) type = 'date'
        else if (f.type === 7) type = 'checkbox'
        else if (f.type === 11) type = 'user'
        else if (f.type === 13) type = 'phone'
        else if (f.type === 15) type = 'url'
        else if (f.type === 17) type = 'attachment'
        else if (f.type === 18) type = 'link'
        else if (f.type === 22) type = 'location'
        else if (f.type === 1001) type = 'created_time'
        else if (f.type === 1002) type = 'modified_time'
        else if (f.type === 1003) type = 'created_user'
        else if (f.type === 1004) type = 'modified_user'

        let options = ''
        if (f.property?.options) {
            options = `, options: [${f.property.options.map(o => `'${o.name}'`).join(', ')}]`
        }

        return `    { key: '${f.field_name}', label: '${f.field_name}', type: '${type}'${options} }`
    })

    return `[\n${fieldList.join(',\n')}\n]`
}

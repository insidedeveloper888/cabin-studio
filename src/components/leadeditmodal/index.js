import { useState, useEffect } from 'react'
import axios from 'axios'
import clientConfig from '../../config/client_config'
import './index.css'

const BASE_ID = 'VNaub1YiNaMtBYsKhsol0mlNgnw'
const TABLE_ID = 'tblt9ruu9VqM0fWo'

const getInitialFormData = (lead) => {
    const fields = lead?.fields || {}
    return {
        Name: fields['Name'] ?? '',
        Contact: fields['Contact'] ?? '',
        'Customer house Location': fields['Customer house Location'] ?? '',
        Grade: fields['Grade'] ?? '',
        BudgetRM: fields['BudgetRM'] ?? '',
        HouseType: fields['HouseType'] ?? '',
        HouseSizeSqFt: fields['HouseSizeSqFt'] ?? '',
        Remarks: fields['Remarks'] ?? '',
    }
}

function LeadEditModal({ lead, onClose, onSave }) {
    const [formData, setFormData] = useState(() => getInitialFormData(lead))
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (lead) {
            setFormData(getInitialFormData(lead))
        }
    }, [lead])

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSave = async () => {
        setSaving(true)
        setError(null)

        try {
            const apiUrl = clientConfig.getApiUrl('/api/base/record')

            // Only send non-empty fields
            const fieldsToUpdate = {}
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    fieldsToUpdate[key] = value
                }
            })

            const res = await axios.put(apiUrl, {
                base_id: BASE_ID,
                table_id: TABLE_ID,
                record_id: lead.record_id,
                fields: fieldsToUpdate
            }, { withCredentials: true })

            if (res.data && res.data.code === 0) {
                onSave(res.data.data)
                onClose()
            } else {
                setError(res.data?.msg || 'Failed to save')
            }
        } catch (err) {
            setError(err.message)
        }
        setSaving(false)
    }

    if (!lead) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Edit Lead</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {error && <div className="modal-error">{error}</div>}

                    <div className="form-group">
                        <label>Name</label>
                        <input
                            type="text"
                            value={formData.Name}
                            onChange={e => handleChange('Name', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Contact</label>
                        <input
                            type="text"
                            value={formData.Contact}
                            onChange={e => handleChange('Contact', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Location</label>
                        <input
                            type="text"
                            value={formData['Customer house Location']}
                            onChange={e => handleChange('Customer house Location', e.target.value)}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Grade</label>
                            <select
                                value={formData.Grade}
                                onChange={e => handleChange('Grade', e.target.value)}
                            >
                                <option value="">Select Grade</option>
                                <option value="Grade A（中文）">Grade A（中文）</option>
                                <option value="Grade B（中文）">Grade B（中文）</option>
                                <option value="Grade B（英文）">Grade B（英文）</option>
                                <option value="Grade C">Grade C</option>
                                <option value="Grade D">Grade D</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Budget</label>
                            <select
                                value={formData.BudgetRM}
                                onChange={e => handleChange('BudgetRM', e.target.value)}
                            >
                                <option value="">Select Budget</option>
                                <option value="RM15K ～ RM20K">RM15K ～ RM20K</option>
                                <option value="RM20K ～ RM40K">RM20K ～ RM40K</option>
                                <option value="RM40K ～ RM60K">RM40K ～ RM60K</option>
                                <option value="RM60K以上">RM60K以上</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>House Type</label>
                            <select
                                value={formData.HouseType}
                                onChange={e => handleChange('HouseType', e.target.value)}
                            >
                                <option value="">Select Type</option>
                                <option value="公寓">公寓</option>
                                <option value="排屋">排屋</option>
                                <option value="Semi-D">Semi-D</option>
                                <option value="独立式洋房">独立式洋房</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>House Size</label>
                            <select
                                value={formData.HouseSizeSqFt}
                                onChange={e => handleChange('HouseSizeSqFt', e.target.value)}
                            >
                                <option value="">Select Size</option>
                                <option value="800～1000 平方英尺">800～1000 平方英尺</option>
                                <option value="1000～1500 平方英尺">1000～1500 平方英尺</option>
                                <option value="1500～2000 平方英尺">1500～2000 平方英尺</option>
                                <option value="2000 平方英尺以上">2000 平方英尺以上</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Remarks</label>
                        <textarea
                            value={formData.Remarks}
                            onChange={e => handleChange('Remarks', e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="btn-save" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default LeadEditModal

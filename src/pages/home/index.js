import React, { useEffect, useState } from "react"
import axios from 'axios'
import UserInfo from "../../components/userinfo"
import TodayAppointments from "../../components/appointments"
import LeadsList from "../../components/leadslist"
import LeadEditModal from "../../components/leadeditmodal"
import { handleJSAPIAccess, handleUserAuth } from '../../utils/auth_access_util'
import clientConfig from '../../config/client_config'
import './index.css'

const BASE_ID = 'VNaub1YiNaMtBYsKhsol0mlNgnw'
const TABLE_ID = 'tblt9ruu9VqM0fWo'

export default function Home() {
    const [userInfo, setUserInfo] = useState(null)
    const [authLoading, setAuthLoading] = useState(true)
    const [authError, setAuthError] = useState(null)
    const [leads, setLeads] = useState([])
    const [leadsLoading, setLeadsLoading] = useState(false)
    const [leadsError, setLeadsError] = useState(null)
    const [selectedLead, setSelectedLead] = useState(null)

    useEffect(() => {
        handleJSAPIAccess((isSuccess) => {
            if (!isSuccess) {
                setAuthError('JSAPI authentication failed')
                setAuthLoading(false)
                return
            }
            handleUserAuth((user) => {
                if (user) {
                    setUserInfo(user)
                    fetchLeads()
                } else {
                    setAuthError('User authentication failed')
                }
                setAuthLoading(false)
            })
        })
    }, [])

    const fetchLeads = async () => {
        setLeadsLoading(true)
        setLeadsError(null)
        try {
            const apiUrl = clientConfig.getApiUrl(`/api/base/records?base_id=${BASE_ID}&table_id=${TABLE_ID}&page_size=500`)
            const res = await axios.get(apiUrl, { withCredentials: true })
            if (res.data && res.data.code === 0) {
                setLeads(res.data.data.items || [])
            } else {
                setLeadsError(res.data?.msg || 'Failed to load leads')
            }
        } catch (err) {
            setLeadsError(err.message)
        }
        setLeadsLoading(false)
    }

    const handleLeadClick = (lead) => {
        setSelectedLead(lead)
    }

    const handleModalClose = () => {
        setSelectedLead(null)
    }

    const handleLeadSave = (updatedRecord) => {
        // Update the lead in the local state
        setLeads(prevLeads => prevLeads.map(lead =>
            lead.record_id === updatedRecord.record.record_id
                ? { ...lead, fields: updatedRecord.record.fields }
                : lead
        ))
    }

    if (authLoading) {
        return (
            <div className="home">
                <div className="loading">Authenticating...</div>
            </div>
        )
    }

    if (authError) {
        return (
            <div className="home">
                <div className="error">{authError}</div>
            </div>
        )
    }

    return (
        <div className="home">
            <UserInfo userInfo={userInfo} />
            <TodayAppointments leads={leads} />
            <LeadsList
                leads={leads}
                loading={leadsLoading}
                error={leadsError}
                onLeadClick={handleLeadClick}
            />
            {selectedLead && (
                <LeadEditModal
                    lead={selectedLead}
                    onClose={handleModalClose}
                    onSave={handleLeadSave}
                />
            )}
        </div>
    )
}
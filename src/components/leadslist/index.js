import './index.css'

function LeadsList({ leads, loading, error, onLeadClick }) {
    if (loading) {
        return <div className="leads-loading">Loading leads...</div>
    }

    if (error) {
        return <div className="leads-error">{error}</div>
    }

    if (!leads || leads.length === 0) {
        return <div className="leads-empty">No leads found</div>
    }

    return (
        <div className="leads-list">
            <h2 className="leads-title">Leads ({leads.length})</h2>
            <div className="leads-grid">
                {leads.map((lead) => (
                    <LeadCard key={lead.record_id} lead={lead} onClick={() => onLeadClick(lead)} />
                ))}
            </div>
        </div>
    )
}

function LeadCard({ lead, onClick }) {
    const fields = lead.fields || {}
    const name = fields['Name'] || 'Unknown'
    const contact = fields['Contact'] || '-'
    const grade = fields['Grade'] || '-'
    const phase = fields['Phase'] || '-'
    const campaign = fields['Campaign']?.[0] || '-'
    const followUp = fields['Follow-Up Status']?.[0] || '-'
    const sales = fields['Sales']?.[0]
    const location = fields['Customer house Location'] || '-'

    return (
        <div className="lead-card" onClick={onClick}>
            <div className="lead-header">
                <span className="lead-name">{name}</span>
                {grade !== '-' && <span className="lead-grade">{grade}</span>}
            </div>
            <div className="lead-details">
                <div className="lead-row">
                    <span className="lead-label">Contact:</span>
                    <span className="lead-value">{contact}</span>
                </div>
                <div className="lead-row">
                    <span className="lead-label">Phase:</span>
                    <span className="lead-value">{phase}</span>
                </div>
                <div className="lead-row">
                    <span className="lead-label">Follow-up:</span>
                    <span className="lead-value">{followUp}</span>
                </div>
                <div className="lead-row">
                    <span className="lead-label">Location:</span>
                    <span className="lead-value">{location}</span>
                </div>
                <div className="lead-row">
                    <span className="lead-label">Campaign:</span>
                    <span className="lead-value campaign">{campaign}</span>
                </div>
                {sales && (
                    <div className="lead-row">
                        <span className="lead-label">Sales:</span>
                        <span className="lead-value">{sales.name}</span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default LeadsList

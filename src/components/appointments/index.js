import './index.css'

function TodayAppointments({ leads }) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStart = today.getTime()
    const todayEnd = todayStart + 24 * 60 * 60 * 1000

    const todayAppointments = (leads || []).filter(lead => {
        const fields = lead.fields || {}
        const startDate = fields['Appointment Start Date']
        if (!startDate) return false
        return startDate >= todayStart && startDate < todayEnd
    }).sort((a, b) => {
        const aStart = a.fields['Appointment Start Date'] || 0
        const bStart = b.fields['Appointment Start Date'] || 0
        return aStart - bStart
    })

    if (todayAppointments.length === 0) {
        return (
            <div className="appointments-section">
                <h2 className="appointments-title">Today's Appointments</h2>
                <div className="appointments-empty">No appointments scheduled for today</div>
            </div>
        )
    }

    return (
        <div className="appointments-section">
            <h2 className="appointments-title">Today's Appointments ({todayAppointments.length})</h2>
            <div className="appointments-list">
                {todayAppointments.map(lead => (
                    <AppointmentCard key={lead.record_id} lead={lead} />
                ))}
            </div>
        </div>
    )
}

function AppointmentCard({ lead }) {
    const fields = lead.fields || {}
    const name = fields['Name'] || 'Unknown'
    const contact = fields['Contact'] || '-'
    const startDate = fields['Appointment Start Date']
    const endDate = fields['Appointment End Date']
    const location = fields['Customer house Location'] || '-'
    const sales = fields['Sales']?.[0]

    const formatTime = (timestamp) => {
        if (!timestamp) return '-'
        const date = new Date(timestamp)
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })
    }

    return (
        <div className="appointment-card">
            <div className="appointment-time">
                <span className="time-start">{formatTime(startDate)}</span>
                <span className="time-separator">-</span>
                <span className="time-end">{formatTime(endDate)}</span>
            </div>
            <div className="appointment-details">
                <div className="appointment-name">{name}</div>
                <div className="appointment-info">
                    <span className="info-item">{contact}</span>
                    {location !== '-' && <span className="info-item">{location}</span>}
                </div>
                {sales && (
                    <div className="appointment-sales">
                        <img className="sales-avatar" src={sales.avatar_url} alt={sales.name} />
                        <span className="sales-name">{sales.name}</span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default TodayAppointments

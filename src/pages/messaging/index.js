import React, { useEffect, useState } from 'react'
import axios from 'axios'
import clientConfig from '../../config/client_config'
import './index.css'

const getApiUrl = clientConfig.getApiUrl

// Card templates for interactive messages
const CARD_TEMPLATES = {
    simple: {
        name: 'Simple',
        template: {
            config: { wide_screen_mode: true },
            header: {
                title: { tag: 'plain_text', content: 'Card Title' },
                template: 'blue'
            },
            elements: [
                { tag: 'div', text: { tag: 'lark_md', content: 'This is the card body text.' } }
            ]
        }
    },
    withButton: {
        name: 'With Button',
        template: {
            config: { wide_screen_mode: true },
            header: {
                title: { tag: 'plain_text', content: 'Action Required' },
                template: 'green'
            },
            elements: [
                { tag: 'div', text: { tag: 'lark_md', content: 'Please click the button below.' } },
                {
                    tag: 'action',
                    actions: [{
                        tag: 'button',
                        text: { tag: 'plain_text', content: 'Click Me' },
                        type: 'primary',
                        value: { action: 'confirm' }
                    }]
                }
            ]
        }
    },
    notification: {
        name: 'Notification',
        template: {
            config: { wide_screen_mode: true },
            header: {
                title: { tag: 'plain_text', content: 'New Notification' },
                template: 'orange'
            },
            elements: [
                {
                    tag: 'div',
                    fields: [
                        { is_short: true, text: { tag: 'lark_md', content: '**From:**\nCabin Studio' } },
                        { is_short: true, text: { tag: 'lark_md', content: '**Time:**\nJust now' } }
                    ]
                },
                { tag: 'hr' },
                { tag: 'div', text: { tag: 'lark_md', content: 'You have a new notification.' } }
            ]
        }
    },
    approval: {
        name: 'Approval',
        template: {
            config: { wide_screen_mode: true },
            header: {
                title: { tag: 'plain_text', content: 'Approval Request' },
                template: 'purple'
            },
            elements: [
                { tag: 'div', text: { tag: 'lark_md', content: '**Requester:** John Doe\n**Type:** Leave Request' } },
                { tag: 'hr' },
                {
                    tag: 'action',
                    actions: [
                        { tag: 'button', text: { tag: 'plain_text', content: 'Approve' }, type: 'primary', value: { action: 'approve' } },
                        { tag: 'button', text: { tag: 'plain_text', content: 'Reject' }, type: 'danger', value: { action: 'reject' } }
                    ]
                }
            ]
        }
    }
}

export default function Messaging() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedUser, setSelectedUser] = useState(null)
    const [messageType, setMessageType] = useState('text')
    const [textMessage, setTextMessage] = useState('')
    const [cardContent, setCardContent] = useState('')
    const [sending, setSending] = useState(false)
    const [sendResult, setSendResult] = useState(null)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await axios.get(getApiUrl('/api/org/users'), { withCredentials: true })
            console.log('Users response:', res.data)
            if (res.data?.code === 0) {
                setUsers(res.data.data?.items || [])
            } else {
                setError(res.data?.msg || 'Failed to fetch users')
            }
        } catch (err) {
            console.error('Fetch users error:', err)
            setError(err.response?.data?.msg || err.message)
        }
        setLoading(false)
    }

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!selectedUser) return

        const content = messageType === 'text' ? textMessage.trim() : cardContent.trim()
        if (!content) return

        setSending(true)
        setSendResult(null)

        try {
            let finalContent = content
            if (messageType === 'interactive') {
                try {
                    finalContent = JSON.parse(content)
                } catch {
                    // Send as string if JSON parse fails
                }
            }

            const res = await axios.post(getApiUrl('/api/message/send'), {
                receive_id: selectedUser.open_id,
                receive_id_type: 'open_id',
                msg_type: messageType,
                content: finalContent
            }, { withCredentials: true })

            console.log('Send result:', res.data)
            if (res.data?.code === 0) {
                setSendResult({ success: true, message: 'Message sent!' })
                if (messageType === 'text') setTextMessage('')
            } else {
                setSendResult({ success: false, message: res.data?.msg || 'Failed to send' })
            }
        } catch (err) {
            console.error('Send error:', err)
            setSendResult({ success: false, message: err.response?.data?.msg || err.message })
        }
        setSending(false)
    }

    const getUserDisplayName = (user) => {
        return user.name || user.en_name || user.email || user.open_id?.slice(-8)
    }

    const loadTemplate = (templateKey) => {
        const template = CARD_TEMPLATES[templateKey]?.template
        if (template) {
            setCardContent(JSON.stringify(template, null, 2))
        }
    }

    if (loading) {
        return <div className="messaging-page"><div className="loading">Loading...</div></div>
    }

    return (
        <div className="messaging-page">
            <div className="messaging-header">
                <h1>Send Message</h1>
            </div>

            {error && (
                <div className="error-banner">
                    {error}
                    <button onClick={fetchUsers}>Retry</button>
                </div>
            )}

            <div className="messaging-simple">
                {/* Step 1: Select Recipient */}
                <div className="step-section">
                    <div className="step-label">1. Select Recipient</div>
                    {users.length > 0 ? (
                        <div className="users-grid">
                            {users.map(user => (
                                <div
                                    key={user.user_id || user.open_id}
                                    className={`user-card ${selectedUser?.open_id === user.open_id ? 'selected' : ''}`}
                                    onClick={() => setSelectedUser(user)}
                                >
                                    <div className="user-avatar">
                                        {user.avatar?.avatar_72 ? (
                                            <img src={user.avatar.avatar_72} alt="" />
                                        ) : (
                                            <span>{getUserDisplayName(user).charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="user-name">{getUserDisplayName(user)}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-users">No users found</div>
                    )}
                </div>

                {/* Step 2: Choose Message Type */}
                <div className="step-section">
                    <div className="step-label">2. Message Type</div>
                    <div className="type-selector">
                        <button
                            className={`type-btn ${messageType === 'text' ? 'active' : ''}`}
                            onClick={() => setMessageType('text')}
                        >
                            Text
                        </button>
                        <button
                            className={`type-btn ${messageType === 'interactive' ? 'active' : ''}`}
                            onClick={() => setMessageType('interactive')}
                        >
                            Card
                        </button>
                    </div>
                </div>

                {/* Step 3: Compose */}
                <div className="step-section">
                    <div className="step-label">3. Compose & Send</div>

                    <form onSubmit={handleSendMessage}>
                        {selectedUser && (
                            <div className="recipient-badge">
                                To: {getUserDisplayName(selectedUser)}
                            </div>
                        )}

                        {messageType === 'text' ? (
                            <textarea
                                value={textMessage}
                                onChange={e => setTextMessage(e.target.value)}
                                placeholder={selectedUser ? "Type your message..." : "Select a recipient first"}
                                rows={4}
                                disabled={!selectedUser}
                            />
                        ) : (
                            <>
                                <div className="template-row">
                                    <span>Templates:</span>
                                    {Object.entries(CARD_TEMPLATES).map(([key, { name }]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            className="btn-template"
                                            onClick={() => loadTemplate(key)}
                                        >
                                            {name}
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    value={cardContent}
                                    onChange={e => setCardContent(e.target.value)}
                                    placeholder={selectedUser ? "Select a template or enter card JSON..." : "Select a recipient first"}
                                    rows={10}
                                    disabled={!selectedUser}
                                    className="code-textarea"
                                />
                            </>
                        )}

                        <button
                            type="submit"
                            className="btn-send-main"
                            disabled={!selectedUser || !(messageType === 'text' ? textMessage.trim() : cardContent.trim()) || sending}
                        >
                            {sending ? 'Sending...' : 'Send'}
                        </button>
                    </form>

                    {sendResult && (
                        <div className={`result-toast ${sendResult.success ? 'success' : 'error'}`}>
                            {sendResult.message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

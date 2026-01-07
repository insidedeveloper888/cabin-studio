// Vercel Serverless API - Single catch-all handler for all API routes
const axios = require('axios')
const CryptoJS = require('crypto-js')

// Configuration - Use environment variables in production
const config = {
    // CS Organization App - for authentication & messaging
    appId: process.env.LARK_APP_ID || "cli_a9d749320eb8de1b",
    appSecret: process.env.LARK_APP_SECRET || "dfkGHLwwg86dnnB6nU0E8gBUzwMByver",
    // Cloud Organization App - for Base operations
    baseAppId: process.env.LARK_BASE_APP_ID || "cli_a7c6350f9778d010",
    baseAppSecret: process.env.LARK_BASE_APP_SECRET || "cMfrfWMK5vppT6zh89zzohz5jby8GiRc",
    noncestr: "njrktx6WakWFcdnQAmQ7RDFwJpABKmrb",
}

// Token cache
let tokenCache = { cs: null, csExpiry: 0, base: null, baseExpiry: 0 }

// Get tenant access token for CS org (auth & messaging)
async function getTenantAccessToken() {
    if (tokenCache.cs && Date.now() < tokenCache.csExpiry) {
        return tokenCache.cs
    }
    const res = await axios.post("https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal", {
        app_id: config.appId,
        app_secret: config.appSecret
    })
    if (res.data?.code === 0) {
        tokenCache.cs = res.data.tenant_access_token
        tokenCache.csExpiry = Date.now() + (res.data.expire - 300) * 1000
        return tokenCache.cs
    }
    throw new Error(res.data?.msg || 'Failed to get CS token')
}

// Get tenant access token for Base org (base operations)
async function getBaseAppToken() {
    if (tokenCache.base && Date.now() < tokenCache.baseExpiry) {
        return tokenCache.base
    }
    const res = await axios.post("https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal", {
        app_id: config.baseAppId,
        app_secret: config.baseAppSecret
    })
    if (res.data?.code === 0) {
        tokenCache.base = res.data.tenant_access_token
        tokenCache.baseExpiry = Date.now() + (res.data.expire - 300) * 1000
        return tokenCache.base
    }
    throw new Error(res.data?.msg || 'Failed to get Base token')
}

// Calculate sign parameters for JSAPI
function calculateSignParam(ticket, url) {
    const timestamp = Date.now()
    const verifyStr = `jsapi_ticket=${ticket}&noncestr=${config.noncestr}&timestamp=${timestamp}&url=${url}`
    const signature = CryptoJS.SHA1(verifyStr).toString()
    return { signature, timestamp, noncestr: config.noncestr, appId: config.appId }
}

// Response helpers
const okResponse = (data) => ({ code: 0, msg: 'ok', data })
const failResponse = (msg) => ({ code: -1, msg })

// Route handlers
const handlers = {
    // Auth: Get user access token
    'GET /api/get_user_access_token': async (req) => {
        const code = req.query.code || ''
        if (!code) return failResponse('code is required')

        const internalRes = await axios.post("https://open.larksuite.com/open-apis/auth/v3/app_access_token/internal", {
            app_id: config.appId, app_secret: config.appSecret
        }, { headers: { "Content-Type": "application/json" } })

        if (internalRes.data?.code !== 0) return failResponse(internalRes.data?.msg)

        const authRes = await axios.post("https://open.larksuite.com/open-apis/authen/v1/access_token",
            { grant_type: "authorization_code", code },
            { headers: { "Content-Type": "application/json", "Authorization": "Bearer " + internalRes.data.app_access_token } }
        )

        if (authRes.data?.code !== 0) return failResponse(authRes.data?.msg)
        return okResponse(authRes.data.data)
    },

    // Auth: Get sign parameters
    'GET /api/get_sign_parameters': async (req) => {
        // URL comes encoded from frontend, decode it for signature calculation
        const encodedUrl = req.query.url || ''
        const url = decodeURIComponent(encodedUrl)
        console.log('[Sign] URL for signature:', url)

        const token = await getTenantAccessToken()
        const ticketRes = await axios.post("https://open.larksuite.com/open-apis/jssdk/ticket/get",
            {}, { headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token } }
        )
        if (ticketRes.data?.code !== 0) return failResponse(ticketRes.data?.msg)

        const signParam = calculateSignParam(ticketRes.data.data.ticket, url)
        // Return with app_id field name that JSAPI expects
        return okResponse({
            ...signParam,
            app_id: signParam.appId
        })
    },

    // Base: Get records
    'GET /api/base/records': async (req) => {
        const { base_id, table_id, page_size = 20, page_token } = req.query
        if (!base_id || !table_id) return failResponse('base_id and table_id required')

        const token = await getBaseAppToken()
        let url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${base_id}/tables/${table_id}/records?page_size=${page_size}`
        if (page_token) url += `&page_token=${page_token}`

        const res = await axios.get(url, { headers: { "Authorization": "Bearer " + token } })
        return res.data?.code === 0 ? okResponse(res.data.data) : failResponse(res.data?.msg)
    },

    // Base: Get table fields
    'GET /api/base/fields': async (req) => {
        const { base_id, table_id } = req.query
        if (!base_id || !table_id) return failResponse('base_id and table_id required')

        const token = await getBaseAppToken()
        const res = await axios.get(
            `https://open.larksuite.com/open-apis/bitable/v1/apps/${base_id}/tables/${table_id}/fields?page_size=100`,
            { headers: { "Authorization": "Bearer " + token } }
        )
        return res.data?.code === 0 ? okResponse(res.data.data) : failResponse(res.data?.msg)
    },

    // Base: Create record
    'POST /api/base/record': async (req) => {
        const { base_id, table_id, fields } = req.body || {}
        if (!base_id || !table_id || !fields) return failResponse('base_id, table_id, and fields required')

        const token = await getBaseAppToken()
        const res = await axios.post(
            `https://open.larksuite.com/open-apis/bitable/v1/apps/${base_id}/tables/${table_id}/records`,
            { fields },
            { headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token } }
        )
        return res.data?.code === 0 ? okResponse(res.data.data) : failResponse(res.data?.msg)
    },

    // Base: Update record
    'PUT /api/base/record': async (req) => {
        const { base_id, table_id, record_id, fields } = req.body || {}
        if (!base_id || !table_id || !record_id || !fields) return failResponse('base_id, table_id, record_id, and fields required')

        const token = await getBaseAppToken()
        const res = await axios.put(
            `https://open.larksuite.com/open-apis/bitable/v1/apps/${base_id}/tables/${table_id}/records/${record_id}`,
            { fields },
            { headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token } }
        )
        return res.data?.code === 0 ? okResponse(res.data.data) : failResponse(res.data?.msg)
    },

    // Base: Delete record
    'DELETE /api/base/record': async (req) => {
        const { base_id, table_id, record_id } = req.body || {}
        if (!base_id || !table_id || !record_id) return failResponse('base_id, table_id, and record_id required')

        const token = await getBaseAppToken()
        const res = await axios.delete(
            `https://open.larksuite.com/open-apis/bitable/v1/apps/${base_id}/tables/${table_id}/records/${record_id}`,
            { headers: { "Authorization": "Bearer " + token } }
        )
        return res.data?.code === 0 ? okResponse({ deleted: true, record_id }) : failResponse(res.data?.msg)
    },

    // Base: Batch delete records
    'POST /api/base/records/batch_delete': async (req) => {
        const { base_id, table_id, records } = req.body || {}
        if (!base_id || !table_id || !records?.length) return failResponse('base_id, table_id, and records array required')

        const token = await getBaseAppToken()
        const res = await axios.post(
            `https://open.larksuite.com/open-apis/bitable/v1/apps/${base_id}/tables/${table_id}/records/batch_delete`,
            { records },
            { headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token } }
        )
        return res.data?.code === 0 ? okResponse({ deleted: true, count: records.length }) : failResponse(res.data?.msg)
    },

    // Messaging: Send message
    'POST /api/message/send': async (req) => {
        const { receive_id, receive_id_type = 'open_id', msg_type, content } = req.body || {}
        if (!receive_id || !msg_type || !content) return failResponse('receive_id, msg_type, and content required')

        const token = await getTenantAccessToken()

        let formattedContent = content
        if (msg_type === 'text' && typeof content === 'string') {
            formattedContent = JSON.stringify({ text: content })
        } else if (msg_type === 'interactive') {
            const cardObj = typeof content === 'string' ? JSON.parse(content) : content
            formattedContent = JSON.stringify(cardObj)
        }

        const res = await axios.post(
            `https://open.larksuite.com/open-apis/im/v1/messages?receive_id_type=${receive_id_type}`,
            { receive_id, msg_type, content: formattedContent },
            { headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token } }
        )
        return res.data?.code === 0 ? okResponse(res.data.data) : failResponse(res.data?.msg)
    },

    // Org: Get users
    'GET /api/org/users': async () => {
        const token = await getTenantAccessToken()
        const res = await axios.get(
            `https://open.larksuite.com/open-apis/contact/v3/users/find_by_department?department_id=0&page_size=50`,
            { headers: { "Authorization": "Bearer " + token } }
        )
        return res.data?.code === 0 ? okResponse(res.data.data) : failResponse(res.data?.msg)
    },
}

// Main handler
module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Credentials', 'true')

    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }

    const path = req.url.split('?')[0]
    const routeKey = `${req.method} ${path}`

    console.log(`[API] ${routeKey}`)

    try {
        const handler = handlers[routeKey]
        if (handler) {
            const result = await handler(req)
            return res.status(200).json(result)
        } else {
            return res.status(404).json(failResponse(`Route not found: ${routeKey}`))
        }
    } catch (error) {
        console.error(`[API Error] ${routeKey}:`, error.response?.data || error.message)
        return res.status(500).json(failResponse(error.response?.data?.msg || error.message))
    }
}

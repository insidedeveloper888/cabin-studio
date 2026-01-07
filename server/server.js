const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const axios = require('axios')
const CryptoJS = require('crypto-js')
const session = require('koa-session');
const Pusher = require('pusher')
const serverConfig = require('./server_config')
const serverUtil = require('./server_util')

const LJ_JSTICKET_KEY = 'lk_jsticket'
const LJ_TOKEN_KEY = 'lk_token'
const LEADS_TABLE_ID = 'tblt9ruu9VqM0fWo'

// Pusher configuration (use env vars in production)
const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID || "YOUR_PUSHER_APP_ID",
    key: process.env.PUSHER_KEY || "YOUR_PUSHER_KEY",
    secret: process.env.PUSHER_SECRET || "YOUR_PUSHER_SECRET",
    cluster: process.env.PUSHER_CLUSTER || "ap1",
    useTLS: true
})

//处理免登请求，返回用户的user_access_token
async function getUserAccessToken(ctx) {

    console.log("\n-------------------[接入服务端免登处理 BEGIN]-----------------------------")
    serverUtil.configAccessControl(ctx)
    console.log(`接入服务方第① 步: 接收到前端免登请求`)
    const accessToken = ctx.session.userinfo
    const lkToken = ctx.cookies.get(LJ_TOKEN_KEY) || ''
    if (accessToken && accessToken.access_token && lkToken.length > 0 && accessToken.access_token == lkToken) {
        console.log("接入服务方第② 步: 从Session中获取user_access_token信息，用户已登录")
        ctx.body = serverUtil.okResponse(accessToken)
        console.log("-------------------[接入服务端免登处理 END]-----------------------------\n")
        return
    }

    let code = ctx.query["code"] || ""
    console.log("接入服务方第② 步: 获取登录预授权码code")
    if (code.length == 0) { //code不存在
        ctx.body = serverUtil.failResponse("登录预授权码code is empty, please retry!!!")
        return
    }

    //【请求】app_access_token：https://open.larksuite.com/document/ukTMukTMukTM/ukDNz4SO0MjL5QzM/auth-v3/auth/app_access_token_internal
    console.log("接入服务方第③ 步: 根据AppID和App Secret请求应用授权凭证app_access_token")
    const internalRes = await axios.post("https://open.larksuite.com/open-apis/auth/v3/app_access_token/internal", {
        "app_id": serverConfig.config.appId,
        "app_secret": serverConfig.config.appSecret
    }, { headers: { "Content-Type": "application/json" } })

    if (!internalRes.data) {
        ctx.body = serverUtil.failResponse("app_access_token request error")
        return
    }
    if (internalRes.data.code != 0) { //非0表示失败
        ctx.body = serverUtil.failResponse(`app_access_token request error: ${internalRes.data.msg}`)
        return
    }

    console.log("接入服务方第④ 步: 获得颁发的应用授权凭证app_access_token")
    const app_access_token = internalRes.data.app_access_token || ""

    console.log("接入服务方第⑤ 步: 根据登录预授权码code和app_access_token请求用户授权凭证user_access_token")
    //【请求】user_access_token: https://open.larksuite.com/document/uAjLw4CM/ukTMukTMukTM/reference/authen-v1/access_token/create
    const authenv1Res = await axios.post("https://open.larksuite.com/open-apis/authen/v1/access_token", { "grant_type": "authorization_code", "code": code }, {
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": "Bearer " + app_access_token
        }
    })

    if (!authenv1Res.data) {
        ctx.body = serverUtil.failResponse("access_toke request error")
        return
    }
    if (authenv1Res.data.code != 0) {  //非0表示失败
        ctx.body = serverUtil.failResponse(`access_toke request error: ${authenv1Res.data.msg}`)
        return
    }

    console.log("接入服务方第⑥ 步: 获取颁发的用户授权码凭证的user_access_token, 更新到Session，返回给前端")
    const newAccessToken = authenv1Res.data.data
    if (newAccessToken) {
        ctx.session.userinfo = newAccessToken
        serverUtil.setCookie(ctx, LJ_TOKEN_KEY, newAccessToken.access_token || '')
    } else {
        serverUtil.setCookie(ctx, LJ_TOKEN_KEY, '')
    }

    ctx.body = serverUtil.okResponse(newAccessToken)
    console.log("-------------------[接入服务端免登处理 END]-----------------------------\n")
}

//处理鉴权参数请求，返回鉴权参数
async function getSignParameters(ctx) {

    console.log("\n-------------------[接入方服务端鉴权处理 BEGIN]-----------------------------")
    serverUtil.configAccessControl(ctx)
    console.log(`接入服务方第① 步: 接收到前端鉴权请求`)

    const url = ctx.query["url"] ||""
    const tickeString = ctx.cookies.get(LJ_JSTICKET_KEY) || ""
    if (tickeString.length > 0) {
        console.log(`接入服务方第② 步: Cookie中获取jsapi_ticket，计算JSAPI鉴权参数，返回`)
        const signParam = calculateSignParam(tickeString, url)
        ctx.body = serverUtil.okResponse(signParam)
        console.log("-------------------[接入方服务端鉴权处理 END]-----------------------------\n")
        return
    }

    console.log(`接入服务方第② 步: 未检测到jsapi_ticket，根据AppID和App Secret请求自建应用授权凭证tenant_access_token`)
    //【请求】tenant_access_token：https://open.larksuite.com/document/ukTMukTMukTM/ukDNz4SO0MjL5QzM/auth-v3/auth/tenant_access_token_internal
    const internalRes = await axios.post("https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal", {
        "app_id": serverConfig.config.appId,
        "app_secret": serverConfig.config.appSecret
    }, { headers: { "Content-Type": "application/json" } })

    if (!internalRes.data) {
        ctx.body = serverUtil.failResponse('tenant_access_token request error')
        return
    }
    if (internalRes.data.code != 0) {
        ctx.body = serverUtil.failResponse(`tenant_access_token request error: ${internalRes.data.msg}`)
        return
    }

    console.log(`接入服务方第③ 步: 获得颁发的自建应用授权凭证tenant_access_token`)
    const tenant_access_token = internalRes.data.tenant_access_token ||""

    console.log(`接入服务方第④ 步: 请求JSAPI临时授权凭证`)
    //【请求】jsapi_ticket：https://open.larksuite.com/document/ukTMukTMukTM/uYTM5UjL2ETO14iNxkTN/h5_js_sdk/authorization
    const ticketRes = await axios.post("https://open.larksuite.com/open-apis/jssdk/ticket/get", {}, {
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": "Bearer " + tenant_access_token
        }
    })

    if (!ticketRes.data) {
        ctx.body = serverUtil.failResponse('get jssdk ticket request error')
        return
    }
    if (ticketRes.data.code != 0) { //非0表示失败
        ctx.body = serverUtil.failResponse(`get jssdk ticket request error: ${ticketRes.data.msg}`)
        return
    }

    console.log(`接入服务方第⑤ 步: 获得颁发的JSAPI临时授权凭证，更新到Cookie`)
    const newTicketString = ticketRes.data.data.ticket || ""
    if (newTicketString.length > 0) {
        serverUtil.setCookie(ctx, LJ_JSTICKET_KEY, newTicketString)
    }

    console.log(`接入服务方第⑥ 步: 计算出JSAPI鉴权参数，并返回给前端`)
    const signParam = calculateSignParam(newTicketString, url)
    ctx.body = serverUtil.okResponse(signParam)
    console.log("-------------------[接入方服务端鉴权处理 END]-----------------------------\n")
}

//计算鉴权参数
function calculateSignParam(tickeString, url) {
    const timestamp = (new Date()).getTime()
    const verifyStr = `jsapi_ticket=${tickeString}&noncestr=${serverConfig.config.noncestr}&timestamp=${timestamp}&url=${url}`
    let signature = CryptoJS.SHA1(verifyStr).toString(CryptoJS.enc.Hex)
    const signParam = {
        "app_id": serverConfig.config.appId,
        "signature": signature,
        "noncestr": serverConfig.config.noncestr,
        "timestamp": timestamp,
    }
    return signParam
}

// Get tenant access token helper (CS Organization - for auth & messaging)
async function getTenantAccessToken() {
    const res = await axios.post("https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal", {
        "app_id": serverConfig.config.appId,
        "app_secret": serverConfig.config.appSecret
    }, { headers: { "Content-Type": "application/json" } })

    if (res.data && res.data.code === 0) {
        return res.data.tenant_access_token
    }
    throw new Error(res.data?.msg || 'Failed to get tenant access token')
}

// Get Base app tenant access token (Cloud Organization - for Base operations)
async function getBaseAppToken() {
    const res = await axios.post("https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal", {
        "app_id": serverConfig.config.baseAppId,
        "app_secret": serverConfig.config.baseAppSecret
    }, { headers: { "Content-Type": "application/json" } })

    if (res.data && res.data.code === 0) {
        return res.data.tenant_access_token
    }
    throw new Error(res.data?.msg || 'Failed to get Base app access token')
}

// Fetch table fields/schema (uses Cloud org app)
async function getTableFields(ctx) {
    console.log("\n-------------------[Fetch Table Fields BEGIN]-----------------------------")
    serverUtil.configAccessControl(ctx)

    const baseId = ctx.query["base_id"] || ""
    const tableId = ctx.query["table_id"] || ""

    if (!baseId || !tableId) {
        ctx.body = serverUtil.failResponse("base_id and table_id are required")
        return
    }

    try {
        const token = await getBaseAppToken()
        const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${baseId}/tables/${tableId}/fields`

        const res = await axios.get(url, {
            headers: {
                "Authorization": "Bearer " + token
            }
        })

        console.log("Table fields response:", JSON.stringify(res.data, null, 2))

        if (res.data && res.data.code === 0) {
            ctx.body = serverUtil.okResponse(res.data.data)
        } else {
            ctx.body = serverUtil.failResponse(res.data?.msg || 'Failed to fetch fields')
        }
    } catch (error) {
        ctx.body = serverUtil.failResponse(error.message)
    }
    console.log("-------------------[Fetch Table Fields END]-----------------------------\n")
}

// Fetch records from Base table (uses Cloud org app)
async function getBaseRecords(ctx) {
    console.log("\n-------------------[Fetch Base Records BEGIN]-----------------------------")
    serverUtil.configAccessControl(ctx)

    const baseId = ctx.query["base_id"] || ""
    const tableId = ctx.query["table_id"] || ""
    const pageToken = ctx.query["page_token"] || ""
    const pageSize = ctx.query["page_size"] || "20"

    if (!baseId || !tableId) {
        ctx.body = serverUtil.failResponse("base_id and table_id are required")
        return
    }

    try {
        const token = await getBaseAppToken()  // Use Cloud org app
        let url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${baseId}/tables/${tableId}/records?page_size=${pageSize}`
        if (pageToken) {
            url += `&page_token=${pageToken}`
        }

        const res = await axios.get(url, {
            headers: {
                "Authorization": "Bearer " + token
            }
        })

        if (res.data && res.data.code === 0) {
            ctx.body = serverUtil.okResponse(res.data.data)
        } else {
            ctx.body = serverUtil.failResponse(res.data?.msg || 'Failed to fetch records')
        }
    } catch (error) {
        ctx.body = serverUtil.failResponse(error.message)
    }
    console.log("-------------------[Fetch Base Records END]-----------------------------\n")
}

// Update a record in Base table (uses Cloud org app)
async function updateBaseRecord(ctx) {
    console.log("\n-------------------[Update Base Record BEGIN]-----------------------------")
    serverUtil.configAccessControl(ctx)

    const { base_id, table_id, record_id, fields } = ctx.request.body || {}
    console.log("Request body:", JSON.stringify(ctx.request.body, null, 2))

    if (!base_id || !table_id || !record_id || !fields) {
        ctx.body = serverUtil.failResponse("base_id, table_id, record_id, and fields are required")
        return
    }

    try {
        const token = await getBaseAppToken()
        const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${base_id}/tables/${table_id}/records/${record_id}`

        console.log("Sending to Lark API:", JSON.stringify({ fields }, null, 2))

        const res = await axios.put(url, { fields }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        })

        console.log("Lark API response:", JSON.stringify(res.data, null, 2))

        if (res.data && res.data.code === 0) {
            ctx.body = serverUtil.okResponse(res.data.data)
            console.log(`Record ${record_id} updated successfully`)
        } else {
            ctx.body = serverUtil.failResponse(res.data?.msg || 'Failed to update record')
        }
    } catch (error) {
        console.error('Update error:', error.response?.data || error.message)
        ctx.body = serverUtil.failResponse(error.response?.data?.msg || error.message)
    }
    console.log("-------------------[Update Base Record END]-----------------------------\n")
}

// Create a new record in Base table (uses Cloud org app)
async function createBaseRecord(ctx) {
    console.log("\n-------------------[Create Base Record BEGIN]-----------------------------")
    serverUtil.configAccessControl(ctx)

    const { base_id, table_id, fields } = ctx.request.body || {}
    console.log("Request body:", JSON.stringify(ctx.request.body, null, 2))

    if (!base_id || !table_id || !fields) {
        ctx.body = serverUtil.failResponse("base_id, table_id, and fields are required")
        return
    }

    try {
        const token = await getBaseAppToken()
        const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${base_id}/tables/${table_id}/records`

        console.log("Sending to Lark API:", JSON.stringify({ fields }, null, 2))

        const res = await axios.post(url, { fields }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        })

        console.log("Lark API response:", JSON.stringify(res.data, null, 2))

        if (res.data && res.data.code === 0) {
            ctx.body = serverUtil.okResponse(res.data.data)
            console.log(`Record created successfully`)
        } else {
            ctx.body = serverUtil.failResponse(res.data?.msg || 'Failed to create record')
        }
    } catch (error) {
        console.error('Create error:', error.response?.data || error.message)
        ctx.body = serverUtil.failResponse(error.response?.data?.msg || error.message)
    }
    console.log("-------------------[Create Base Record END]-----------------------------\n")
}

// Delete a record from Base table (uses Cloud org app)
async function deleteBaseRecord(ctx) {
    console.log("\n-------------------[Delete Base Record BEGIN]-----------------------------")
    serverUtil.configAccessControl(ctx)

    const { base_id, table_id, record_id } = ctx.request.body || {}

    if (!base_id || !table_id || !record_id) {
        ctx.body = serverUtil.failResponse("base_id, table_id, and record_id are required")
        return
    }

    try {
        const token = await getBaseAppToken()
        const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${base_id}/tables/${table_id}/records/${record_id}`

        const res = await axios.delete(url, {
            headers: {
                "Authorization": "Bearer " + token
            }
        })

        if (res.data && res.data.code === 0) {
            ctx.body = serverUtil.okResponse({ deleted: true, record_id })
            console.log(`Record ${record_id} deleted successfully`)
        } else {
            ctx.body = serverUtil.failResponse(res.data?.msg || 'Failed to delete record')
        }
    } catch (error) {
        console.error('Delete error:', error.response?.data || error.message)
        ctx.body = serverUtil.failResponse(error.response?.data?.msg || error.message)
    }
    console.log("-------------------[Delete Base Record END]-----------------------------\n")
}

// Batch delete records from Base table (uses Cloud org app)
async function batchDeleteRecords(ctx) {
    console.log("\n-------------------[Batch Delete Records BEGIN]-----------------------------")
    serverUtil.configAccessControl(ctx)

    const { base_id, table_id, records } = ctx.request.body || {}
    console.log("Request body:", JSON.stringify(ctx.request.body, null, 2))

    if (!base_id || !table_id || !records || !Array.isArray(records) || records.length === 0) {
        ctx.body = serverUtil.failResponse("base_id, table_id, and records array are required")
        return
    }

    try {
        const token = await getBaseAppToken()
        const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${base_id}/tables/${table_id}/records/batch_delete`

        const res = await axios.post(url, { records }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        })

        console.log("Lark API response:", JSON.stringify(res.data, null, 2))

        if (res.data && res.data.code === 0) {
            ctx.body = serverUtil.okResponse({ deleted: true, count: records.length })
            console.log(`${records.length} records deleted successfully`)
        } else {
            ctx.body = serverUtil.failResponse(res.data?.msg || 'Failed to batch delete records')
        }
    } catch (error) {
        console.error('Batch delete error:', error.response?.data || error.message)
        ctx.body = serverUtil.failResponse(error.response?.data?.msg || error.message)
    }
    console.log("-------------------[Batch Delete Records END]-----------------------------\n")
}

// Send message to user (uses CS org app for messaging)
async function sendMessage(ctx) {
    console.log("\n-------------------[Send Message BEGIN]-----------------------------")
    serverUtil.configAccessControl(ctx)

    const { receive_id, receive_id_type, msg_type, content } = ctx.request.body || {}
    console.log("Request body:", JSON.stringify(ctx.request.body, null, 2))

    if (!receive_id || !msg_type || !content) {
        ctx.body = serverUtil.failResponse("receive_id, msg_type, and content are required")
        return
    }

    try {
        // Use CS org app token for messaging
        const token = await getTenantAccessToken()
        const url = `https://open.larksuite.com/open-apis/im/v1/messages?receive_id_type=${receive_id_type || 'open_id'}`

        // Format content based on msg_type
        // Lark API requires content to be a JSON STRING for all message types
        let formattedContent = content
        if (msg_type === 'text' && typeof content === 'string') {
            formattedContent = JSON.stringify({ text: content })
        } else if (msg_type === 'interactive') {
            // Interactive card - content MUST be a JSON string
            // Parse first (if string) to validate, then stringify
            const cardObj = typeof content === 'string' ? JSON.parse(content) : content
            formattedContent = JSON.stringify(cardObj)
        }

        console.log("Sending to Lark:", { receive_id, msg_type, content: formattedContent })

        const res = await axios.post(url, {
            receive_id,
            msg_type,
            content: formattedContent
        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        })

        console.log("Lark API response:", JSON.stringify(res.data, null, 2))

        if (res.data && res.data.code === 0) {
            ctx.body = serverUtil.okResponse(res.data.data)
            console.log(`Message sent successfully`)
        } else {
            ctx.body = serverUtil.failResponse(res.data?.msg || 'Failed to send message')
        }
    } catch (error) {
        console.error('Send message error:', error.response?.data || error.message)
        ctx.body = serverUtil.failResponse(error.response?.data?.msg || error.message)
    }
    console.log("-------------------[Send Message END]-----------------------------\n")
}

// Get user list from CS org (for selecting message recipients)
async function getOrgUsers(ctx) {
    console.log("\n-------------------[Get Org Users BEGIN]-----------------------------")
    serverUtil.configAccessControl(ctx)

    try {
        const token = await getTenantAccessToken()

        // Method 1: Get users from root department (department_id=0)
        // This requires scope: contact:user.base:readonly or contact:user.employee_id:readonly
        const url = `https://open.larksuite.com/open-apis/contact/v3/users/find_by_department?department_id=0&page_size=50`

        console.log("Fetching users from root department...")
        const res = await axios.get(url, {
            headers: {
                "Authorization": "Bearer " + token
            }
        })

        console.log("Users response:", JSON.stringify(res.data, null, 2))

        if (res.data && res.data.code === 0) {
            ctx.body = serverUtil.okResponse(res.data.data)
        } else {
            // If find_by_department fails, try the scopes endpoint
            console.log("Trying scopes endpoint...")
            const scopesRes = await axios.get(
                `https://open.larksuite.com/open-apis/contact/v3/scopes?page_size=50&user_id_type=open_id`,
                { headers: { "Authorization": "Bearer " + token } }
            )

            console.log("Scopes response:", JSON.stringify(scopesRes.data, null, 2))

            if (scopesRes.data?.code === 0 && scopesRes.data.data?.user_ids?.length > 0) {
                // Get user details for each user_id
                const userIds = scopesRes.data.data.user_ids
                const usersData = await Promise.all(
                    userIds.slice(0, 20).map(async (userId) => {
                        try {
                            const userRes = await axios.get(
                                `https://open.larksuite.com/open-apis/contact/v3/users/${userId}?user_id_type=open_id`,
                                { headers: { "Authorization": "Bearer " + token } }
                            )
                            return userRes.data?.data?.user
                        } catch (e) {
                            return null
                        }
                    })
                )
                ctx.body = serverUtil.okResponse({ items: usersData.filter(Boolean) })
            } else {
                ctx.body = serverUtil.failResponse(res.data?.msg || 'Failed to get users. Check app scopes.')
            }
        }
    } catch (error) {
        console.error('Get users error:', error.response?.data || error.message)
        ctx.body = serverUtil.failResponse(error.response?.data?.msg || error.message)
    }
    console.log("-------------------[Get Org Users END]-----------------------------\n")
}

// Webhook handler for Lark events
async function handleWebhook(ctx) {
    console.log("\n-------------------[Webhook BEGIN]-----------------------------")
    serverUtil.configAccessControl(ctx)

    const body = ctx.request.body || {}
    console.log("Webhook received:", JSON.stringify(body, null, 2))

    // Handle URL verification challenge
    if (body.type === 'url_verification') {
        console.log("URL verification challenge")
        ctx.body = { challenge: body.challenge }
        console.log("-------------------[Webhook END]-----------------------------\n")
        return
    }

    // Handle actual events
    const event = body.event || {}
    const header = body.header || {}
    const eventType = header.event_type || body.type

    console.log("Event type:", eventType)

    // Handle Base record change events
    if (eventType === 'drive.file.bitable_record_changed_v1') {
        const tableId = event.table_id
        const actionList = event.action_list || []

        console.log("Base record changed, table:", tableId)

        if (tableId === LEADS_TABLE_ID) {
            try {
                await pusher.trigger('leads-channel', 'record-changed', {
                    table_id: tableId,
                    actions: actionList,
                    timestamp: Date.now()
                })
                console.log("Pusher event triggered")
            } catch (err) {
                console.error("Pusher error:", err.message)
            }
        }
    }

    ctx.body = { code: 0, msg: 'ok' }
    console.log("-------------------[Webhook END]-----------------------------\n")
}

// Pusher config endpoint
async function getPusherConfig(ctx) {
    serverUtil.configAccessControl(ctx)
    ctx.body = serverUtil.okResponse({
        key: process.env.PUSHER_KEY || "YOUR_PUSHER_KEY",
        cluster: process.env.PUSHER_CLUSTER || "ap1"
    })
}

///Start Sever
const app = new Koa()
const router = new Router();

//配置Session的中间件
app.keys = ['some secret hurr'];   /*cookie的签名*/
const koaSessionConfig = {
    key: 'lk_koa:session', /** 默认 */
    maxAge: 2 * 3600 * 1000,  /*  cookie的过期时间，单位 ms  */
    overwrite: true, /** (boolean) can overwrite or not (default true)  默认 */
    httpOnly: true, /**  true表示只有服务器端可以获取cookie */
    signed: true, /** 默认 签名 */
    rolling: true, /** 在每次请求时强行设置 cookie，这将重置 cookie 过期时间（默认：false） 【需要修改】 */
    renew: false, /** (boolean) renew session when session is nearly expired      【需要修改】*/
};
app.use(session(koaSessionConfig, app));
app.use(bodyParser());

// CORS middleware - handle preflight OPTIONS requests
app.use(async (ctx, next) => {
    ctx.set("Access-Control-Allow-Origin", ctx.headers.origin || "*");
    ctx.set("Access-Control-Allow-Methods", "OPTIONS, GET, PUT, POST, DELETE");
    ctx.set("Access-Control-Allow-Credentials", "true");
    ctx.set("Access-Control-Allow-Headers", "x-requested-with, accept, origin, content-type");

    if (ctx.method === 'OPTIONS') {
        ctx.status = 204;
        return;
    }
    await next();
});

//注册服务端路由和处理
router.get(serverConfig.config.getUserAccessTokenPath, getUserAccessToken)
router.get(serverConfig.config.getSignParametersPath, getSignParameters)
router.get('/api/base/fields', getTableFields)
router.get('/api/base/records', getBaseRecords)
router.post('/api/base/record', createBaseRecord)
router.put('/api/base/record', updateBaseRecord)
router.delete('/api/base/record', deleteBaseRecord)
router.post('/api/base/records/batch_delete', batchDeleteRecords)
router.post('/api/message/send', sendMessage)
router.get('/api/org/users', getOrgUsers)
router.post('/api/webhook', handleWebhook)
router.get('/api/pusher/config', getPusherConfig)
var port = process.env.PORT || serverConfig.config.apiPort;
app.use(router.routes()).use(router.allowedMethods());
app.listen(port, () => {
    console.log(`server is start, listening on port ${port}`);
})
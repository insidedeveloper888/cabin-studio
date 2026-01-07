# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Lark/Larksuite web application quick start template. This is a full-stack React + Koa project that demonstrates OAuth authentication and JSAPI integration with the Lark platform.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start React dev server on port 3005
npm run build        # Production build
npm run config       # Interactive CLI to configure app credentials (appId, appSecret, port)
npm run start        # Start both frontend and legacy Koa backend concurrently
npm run start:server # Start legacy Koa API server only (default port 8989)
```

**Note:** API endpoints are handled via n8n webhooks, not the legacy Koa server.

## Architecture

### Three-Layer Structure

1. **Frontend (React)** - `src/`
   - React 18 with React Router v6
   - Communicates with Lark SDK via `window.h5sdk` and `window.tt` globals
   - Entry: `src/index.js` → `App.js` → routes to pages

2. **Backend (Koa)** - `server/`
   - Handles OAuth token exchange with Lark APIs
   - Two main endpoints:
     - `GET /api/get_user_access_token` - Exchanges auth code for user token
     - `GET /api/get_sign_parameters` - Returns JSAPI signature parameters

3. **CLI Tool** - `cli/`
   - `npm run config` runs interactive prompts to set appId, appSecret, and port
   - Generates both `src/config/client_config.js` and `server/server_config.js`

### Authentication Flow

1. Frontend calls `handleJSAPIAccess()` to authenticate JSAPI capabilities
2. Frontend calls `handleUserAuth()` which uses `tt.requestAuthCode` to get auth code
3. Backend exchanges code for `app_access_token` then `user_access_token` via Lark APIs
4. Tokens stored in Koa session, ticket cached in cookies (`lk_jsticket`, `lk_token`)

### Key Files

- `src/utils/auth_access_util.js` - All Lark SDK interactions and auth logic
- `server/server.js` - OAuth flow implementation with Lark Open APIs
- `src/config/client_config.js` / `server/server_config.js` - Auto-generated config files (do not edit manually)

### Lark API Endpoints Used

- `https://open.larksuite.com/open-apis/auth/v3/app_access_token/internal`
- `https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal`
- `https://open.larksuite.com/open-apis/authen/v1/access_token`
- `https://open.larksuite.com/open-apis/jssdk/ticket/get`

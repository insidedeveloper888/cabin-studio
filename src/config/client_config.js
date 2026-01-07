// Client Configuration
// Supports both local development (localhost:8989) and Vercel production (relative paths)

const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

const clientConfig = {
    appId: "cli_a9d749320eb8de1b",
    getUserAccessTokenPath: "/api/get_user_access_token",
    getSignParametersPath: "/api/get_sign_parameters",
    apiPort: "8989",

    // Helper to get API URL - uses localhost:8989 in dev, relative path in production
    getApiUrl: (path) => {
        if (isDev) {
            return `http://${window.location.hostname}:8989${path}`
        }
        return path  // Relative path for Vercel
    }
}

export default clientConfig;
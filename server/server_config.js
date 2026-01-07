// Server Configuration for Multi-App Setup

const config = {
    // CS Organization App - for authentication & messaging
    appId: "cli_a9d749320eb8de1b",
    appSecret: "dfkGHLwwg86dnnB6nU0E8gBUzwMByver",

    // Cloud Organization App - for Base operations (view/edit records)
    baseAppId: "cli_a7c6350f9778d010",         // TODO: Replace with Cloud org app ID
    baseAppSecret: "cMfrfWMK5vppT6zh89zzohz5jby8GiRc", // TODO: Replace with Cloud org app secret

    // API paths
    getUserAccessTokenPath: "/api/get_user_access_token",
    getSignParametersPath: "/api/get_sign_parameters",
    noncestr: "njrktx6WakWFcdnQAmQ7RDFwJpABKmrb",
    apiPort: "8989",
}

module.exports = { config: config };
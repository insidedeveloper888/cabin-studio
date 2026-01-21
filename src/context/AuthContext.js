import React, { createContext, useContext, useState, useEffect } from 'react'
import { handleJSAPIAccess, handleUserAuth } from '../utils/auth_access_util'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [userInfo, setUserInfo] = useState(null)
    const [authLoading, setAuthLoading] = useState(true)
    const [authError, setAuthError] = useState(null)

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
                } else {
                    setAuthError('User authentication failed')
                }
                setAuthLoading(false)
            })
        })
    }, [])

    return (
        <AuthContext.Provider value={{ userInfo, authLoading, authError }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export default AuthContext

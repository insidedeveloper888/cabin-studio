import { useState, useCallback } from 'react'
import axios from 'axios'
import clientConfig from '../config/client_config'
import { BASE_ID, TABLES } from '../config/tables'

/**
 * Custom hook for CRUD operations on Lark Base tables
 * @param {string} tableKey - Key from TABLES config (e.g., 'leads', 'installation')
 */
export function useTableData(tableKey) {
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [hasMore, setHasMore] = useState(false)
    const [pageToken, setPageToken] = useState(null)

    const tableId = TABLES[tableKey]?.id

    // Fetch records with pagination
    const fetchRecords = useCallback(async (options = {}) => {
        if (!tableId) {
            setError(`Invalid table key: ${tableKey}`)
            return
        }

        const {
            showLoading = true,
            append = false,
            pageSize = 100,
            filter,
            sort
        } = options

        if (showLoading) setLoading(true)
        setError(null)

        try {
            let url = `/api/base/records?base_id=${BASE_ID}&table_id=${tableId}&page_size=${pageSize}`

            if (append && pageToken) {
                url += `&page_token=${pageToken}`
            }

            if (filter) {
                url += `&filter=${encodeURIComponent(filter)}`
            }

            if (sort) {
                url += `&sort=${encodeURIComponent(JSON.stringify(sort))}`
            }

            const apiUrl = clientConfig.getApiUrl(url)
            const res = await axios.get(apiUrl, { withCredentials: true })

            if (res.data && res.data.code === 0) {
                const items = res.data.data.items || []
                if (append) {
                    setRecords(prev => [...prev, ...items])
                } else {
                    setRecords(items)
                }
                setHasMore(res.data.data.has_more || false)
                setPageToken(res.data.data.page_token || null)
                return items
            } else {
                setError(res.data?.msg || 'Failed to fetch records')
                return []
            }
        } catch (err) {
            setError(err.message)
            return []
        } finally {
            if (showLoading) setLoading(false)
        }
    }, [tableId, tableKey, pageToken])

    // Fetch more records (pagination)
    const fetchMore = useCallback(async () => {
        if (!hasMore || !pageToken) return
        return fetchRecords({ append: true, showLoading: false })
    }, [hasMore, pageToken, fetchRecords])

    // Create a new record
    const createRecord = useCallback(async (fields) => {
        if (!tableId) {
            throw new Error(`Invalid table key: ${tableKey}`)
        }

        const apiUrl = clientConfig.getApiUrl('/api/base/record')
        const res = await axios.post(apiUrl, {
            base_id: BASE_ID,
            table_id: tableId,
            fields
        }, { withCredentials: true })

        if (res.data && res.data.code === 0) {
            const newRecord = res.data.data.record
            setRecords(prev => [newRecord, ...prev])
            return newRecord
        } else {
            throw new Error(res.data?.msg || 'Failed to create record')
        }
    }, [tableId, tableKey])

    // Update an existing record
    const updateRecord = useCallback(async (recordId, fields) => {
        if (!tableId) {
            throw new Error(`Invalid table key: ${tableKey}`)
        }

        const apiUrl = clientConfig.getApiUrl('/api/base/record')
        const res = await axios.put(apiUrl, {
            base_id: BASE_ID,
            table_id: tableId,
            record_id: recordId,
            fields
        }, { withCredentials: true })

        if (res.data && res.data.code === 0) {
            const updatedRecord = res.data.data.record
            setRecords(prev => prev.map(record =>
                record.record_id === recordId
                    ? { ...record, fields: updatedRecord.fields }
                    : record
            ))
            return updatedRecord
        } else {
            throw new Error(res.data?.msg || 'Failed to update record')
        }
    }, [tableId, tableKey])

    // Delete a record
    const deleteRecord = useCallback(async (recordId) => {
        if (!tableId) {
            throw new Error(`Invalid table key: ${tableKey}`)
        }

        const apiUrl = clientConfig.getApiUrl('/api/base/record')
        const res = await axios.delete(apiUrl, {
            data: {
                base_id: BASE_ID,
                table_id: tableId,
                record_id: recordId
            },
            withCredentials: true
        })

        if (res.data && res.data.code === 0) {
            setRecords(prev => prev.filter(record => record.record_id !== recordId))
            return true
        } else {
            throw new Error(res.data?.msg || 'Failed to delete record')
        }
    }, [tableId, tableKey])

    // Update a record in local state only (for optimistic updates)
    const updateLocalRecord = useCallback((recordId, fields) => {
        setRecords(prev => prev.map(record =>
            record.record_id === recordId
                ? { ...record, fields: { ...record.fields, ...fields } }
                : record
        ))
    }, [])

    // Refresh records
    const refresh = useCallback(async () => {
        setPageToken(null)
        return fetchRecords({ showLoading: true })
    }, [fetchRecords])

    return {
        records,
        loading,
        error,
        hasMore,
        fetchRecords,
        fetchMore,
        createRecord,
        updateRecord,
        deleteRecord,
        updateLocalRecord,
        refresh,
        setRecords
    }
}

/**
 * Hook to fetch table field schema
 * @param {string} tableKey - Key from TABLES config
 */
export function useTableFields(tableKey) {
    const [fields, setFields] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const tableId = TABLES[tableKey]?.id

    const fetchFields = useCallback(async () => {
        if (!tableId) {
            setError(`Invalid table key: ${tableKey}`)
            return
        }

        setLoading(true)
        setError(null)

        try {
            const apiUrl = clientConfig.getApiUrl(`/api/base/fields?base_id=${BASE_ID}&table_id=${tableId}`)
            const res = await axios.get(apiUrl, { withCredentials: true })

            if (res.data && res.data.code === 0) {
                setFields(res.data.data.items || [])
                return res.data.data.items
            } else {
                setError(res.data?.msg || 'Failed to fetch fields')
                return []
            }
        } catch (err) {
            setError(err.message)
            return []
        } finally {
            setLoading(false)
        }
    }, [tableId, tableKey])

    return {
        fields,
        loading,
        error,
        fetchFields
    }
}

export default useTableData

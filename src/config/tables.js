// Table configuration for Lead and Project Management System

export const BASE_ID = 'VNaub1YiNaMtBYsKhsol0mlNgnw'

export const TABLES = {
    leads: { id: 'tbld7iESht4jpLf8', name: 'Leads' },
    installation: { id: 'tblH7OWsULe2FWlB', name: 'Installation' },
    defect: { id: 'tbl4lgDSx3EYVra3', name: 'Defect' },
    coring: { id: 'tbl2AtdcDmCFBCDn', name: 'Coring' },
    transport: { id: 'tblejx5pItixUwyQ', name: 'Transport' },
    caseroStone: { id: 'tbltLOyB94xixM3Y', name: 'Casero Stone' },
    plumber: { id: 'tblN1KBZx1aGLK2G', name: 'Plumber' },
}

export const WORK_ORDER_TABLES = ['installation', 'defect', 'coring', 'transport', 'caseroStone', 'plumber']

// Common fields across all work order tables
export const COMMON_WORK_ORDER_FIELDS = [
    'Payment Status',
    'Project Status',
    'Sales Person',
    'Project Size',
    'Project Code',
    'Client Name',
    'Contact Number',
    'Address'
]

// Table-specific field configurations
export const TABLE_FIELDS = {
    leads: [
        'Date', 'No', 'Time', 'Customer Name', 'Contact', 'Phone',
        'Location', 'MKT', 'Sales', 'Remark', 'MKT Remark'
    ],
    installation: [
        ...COMMON_WORK_ORDER_FIELDS,
        'Send Date', 'Install Date', 'Installer', 'Key Location', 'Sampah Status',
        'Stone', 'Backsplash', 'Connection', 'Hood Installation',
        'Relocation', 'Coring', 'Hood Hob', 'Sink Tap', 'Remark'
    ],
    defect: [
        ...COMMON_WORK_ORDER_FIELDS,
        'Delivery Date', 'Defect Date', 'Defect Stage', 'Submit By'
    ],
    coring: [
        ...COMMON_WORK_ORDER_FIELDS,
        'Order Date', 'Open Date', 'Quantity'
    ],
    transport: [
        ...COMMON_WORK_ORDER_FIELDS,
        'Order Date', 'Pick Up Date', 'Driver', 'Pick Up Address', 'Drop Off Address'
    ],
    caseroStone: [
        ...COMMON_WORK_ORDER_FIELDS,
        'Dry Kitchen', 'Wet Kitchen', 'Drawing'
    ],
    plumber: [
        ...COMMON_WORK_ORDER_FIELDS,
        'Relocation Status', 'Connection Status', 'Hood Status', 'Sink Quantity', 'Tap Quantity'
    ]
}

// Status options for kanban views
export const PROJECT_STATUS_OPTIONS = ['New', 'In Progress', 'Completed', 'On Hold', 'Cancelled']
export const PAYMENT_STATUS_OPTIONS = ['Pending', 'Partial', 'Paid', 'Overdue']

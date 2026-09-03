import mongoose from 'mongoose'
import { Notification, AuditLog, Department, Workflow } from '../models/LandModels.js'

const dbReady = () => mongoose.connection && mongoose.connection.readyState === 1

// ---- Notifications ----
export async function listNotifications(req, res) {
  try {
    const query = { userId: String(req.user._id) }
    const rows = await Notification.find(query).sort({ createdAt: -1 }).limit(50).lean()
    const unread = rows.filter((n) => !n.read).length
    res.json({ notifications: rows, unread })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

export async function markNotificationRead(req, res) {
  try {
    const notification = await Notification.findById(req.params.id)
    if (!notification) return res.status(404).json({ message: 'Notification not found' })
    if (String(notification.userId) !== String(req.user._id) && req.user.role !== 'administrator') {
      return res.status(403).json({ message: 'Not permitted' })
    }
    notification.read = true
    await notification.save()
    res.json({ notification })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// ---- Audit logs (admin only) ----
export async function listAudit(req, res) {
  if (req.user.role !== 'administrator') return res.status(403).json({ message: 'Only administrators can view audit logs' })
  try {
    const rows = await AuditLog.find().sort({ createdAt: -1 }).limit(200).lean()
    res.json({ logs: rows, count: rows.length })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// ---- Departments / API interoperability status ----
const DEPT_DEFAULT = [
  { name: 'Revenue Department', shortName: 'Revenue', connected: true, simulated: false, latency: 34, recordsSynced: 1280, apiVersion: 'v1' },
  { name: 'Registration Department', shortName: 'Registration', connected: true, simulated: false, latency: 41, recordsSynced: 520, apiVersion: 'v1' },
  { name: 'Town Planning', shortName: 'Planning', connected: true, simulated: false, latency: 28, recordsSynced: 310, apiVersion: 'v1' },
  { name: 'Property Tax', shortName: 'Tax', connected: true, simulated: false, latency: 22, recordsSynced: 980, apiVersion: 'v1' },
  { name: 'Utilities', shortName: 'Utilities', connected: false, simulated: true, latency: 0, recordsSynced: 0, apiVersion: 'v0 (simulated)' },
  { name: 'Environment', shortName: 'Environment', connected: false, simulated: true, latency: 0, recordsSynced: 0, apiVersion: 'v0 (simulated)' },
]

export async function listDepartments(req, res) {
  try {
    let rows = []
    if (dbReady()) {
      try { rows = await Department.find({}).lean() } catch (_e) { rows = [] }
    }
    if (!rows.length) rows = DEPT_DEFAULT
    res.json({ departments: rows.map((d) => ({ ...d, isDemo: !d._id })) })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/apis — interoperability status for the API & Interop page
export async function apiStatus(_req, res) {
  res.json({
    status: 'simulated',
    endpoints: [
      { module: 'Revenue', method: 'GET', path: '/api/land-records', status: 'connected', demo: true },
      { module: 'Registration', method: 'GET', path: '/api/registrations', status: 'connected', demo: true },
      { module: 'Planning', method: 'GET', path: '/api/building-permissions', status: 'connected', demo: true },
      { module: 'Tax', method: 'GET', path: '/api/property-tax', status: 'connected', demo: true },
      { module: 'Utilities', method: 'GET', path: '/api/utilities', status: 'simulated', demo: true },
      { module: 'Environment', method: 'GET', path: '/api/restrictions', status: 'simulated', demo: true },
    ],
  })
}

// ---- Workflows (admin) ----
const DEFAULT_WORKFLOWS = [
  { serviceCategory: 'Mutation', name: 'Mutation Workflow', steps: [{ key: 'SUBMITTED', label: 'Submitted', assignToRole: 'citizen' }, { key: 'UNDER_REVIEW', label: 'Under Review', assignToRole: 'revenue_officer' }, { key: 'DOCUMENT_VERIFICATION', label: 'Document Verification', assignToRole: 'revenue_officer' }, { key: 'FIELD_VERIFICATION', label: 'Field Verification', assignToRole: 'revenue_officer' }, { key: 'APPROVED', label: 'Approved', assignToRole: 'revenue_officer' }] },
  { serviceCategory: 'Building Permission', name: 'Building Permission Workflow', steps: [{ key: 'SUBMITTED', label: 'Submitted' }, { key: 'UNDER_REVIEW', label: 'Under Review', assignToRole: 'planning_officer' }, { key: 'DOCUMENT_VERIFICATION', label: 'Document Verification' }, { key: 'FIELD_VERIFICATION', label: 'Field Verification' }, { key: 'APPROVED', label: 'Approved' }] },
]

export async function listWorkflows(req, res) {
  try {
    let rows = []
    if (dbReady()) {
      try { rows = await Workflow.find({}).lean() } catch (_e) { rows = [] }
    }
    if (!rows.length) rows = DEFAULT_WORKFLOWS.map((w, i) => ({ ...w, isDemo: true, _id: String(i + 1) }))
    res.json({ workflows: rows })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

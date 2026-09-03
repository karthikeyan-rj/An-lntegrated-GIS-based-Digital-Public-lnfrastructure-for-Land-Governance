import { Application } from '../models/LandModels.js'
import { User } from '../models/User.js'
import { aiService } from '../services/aiService.js'
import { workflowService, canActOnDept, deptLabel } from '../services/workflowService.js'
import { recordAudit } from '../services/auditService.js'
import { notify } from '../services/notificationService.js'

const OFFICERS = ['revenue_officer', 'registration_officer', 'planning_officer', 'tax_officer', 'administrator']
const ALL = ['citizen', ...OFFICERS]

function genApplicationId() {
  return `APL-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`
}

// Service -> routing department mapping
const SERVICE_DEPT = {
  'Building Permission': 'Planning',
  'Mutation': 'Revenue',
  'Record of Rights': 'Revenue',
  'Encumbrance Certificate': 'Registration',
  'Registration': 'Registration',
  'Property Tax': 'Tax',
  'Land Use': 'Planning',
}

// POST /api/applications — create a new application (citizen or officer)
export async function createApplication(req, res) {
  try {
    const { ulpin, serviceName, serviceCategory, parcelId, notes, priority, documents } = req.body || {}
    if (!serviceName) return res.status(400).json({ message: 'serviceName is required' })
    if (!ulpin && !parcelId) return res.status(400).json({ message: 'ulpin or parcelId is required' })

    const applicationId = genApplicationId()
    const deptName = SERVICE_DEPT[serviceName] || serviceCategory || 'Revenue'

    const app = await Application.create({
      ulpin: ulpin || null,
      parcel: parcelId || null,
      applicationId,
      applicantName: req.user.name,
      applicantEmail: req.user.email,
      user: req.user._id,
      serviceName,
      serviceCategory: serviceCategory || 'General',
      status: 'SUBMITTED',
      currentStep: 1,
      department: deptName,
      priority: priority || 'medium',
      notes: notes || '',
      documents: Array.isArray(documents) ? documents : [],
      timeline: [
        {
          status: 'SUBMITTED',
          from: 'DRAFT',
          to: 'SUBMITTED',
          date: new Date(),
          remarks: 'Application submitted',
          officer: req.user.name,
          actorRole: req.user.role,
        },
      ],
    })

    // AI-assisted initial review (non-blocking)
    let ai = null
    try {
      ai = await aiService.applicationAssistant({ application: app.toObject() })
      app.aiReview = {
        summary: ai.summary,
        issues: (ai.findings || []).map((f) => f.message),
        confidence: ai.confidence,
        recommendedAction: ai.recommendedAction,
        generatedAt: new Date(),
      }
      app.aiReview = app.aiReview
      await app.save()
    } catch (_e) {
      /* AI failure should not block application creation */
    }

    await recordAudit({ user: req.user, action: 'application.create', resource: 'application', resourceId: applicationId, result: 'success', metadata: { ulpin, serviceName }, ip: req.ip })
    await notify({ user: req.user, userId: String(req.user._id), title: 'Application submitted', message: `Your application ${applicationId} was submitted successfully.`, type: 'success', link: '/applications', resource: 'application', resourceId: applicationId })

    res.status(201).json({ application: app, aiReview: app.aiReview || null })
  } catch (error) {
    console.error('createApplication error:', error.message)
    res.status(500).json({ message: 'Server error while creating application' })
  }
}

// GET /api/applications — list filtered by role
export async function listApplications(req, res) {
  try {
    const { status, ulpin, search } = req.query
    const query = {}
    if (req.user.role === 'citizen') {
      query.user = req.user._id
    }
    if (status) query.status = status
    if (ulpin) query.ulpin = ulpin
    if (search) {
      const rx = new RegExp(search, 'i')
      query.$or = [{ applicationId: rx }, { applicantName: rx }, { serviceName: rx }, { ulpin: rx }]
    }
    const apps = await Application.find(query).sort({ createdAt: -1 }).lean()
    res.json({ applications: apps, count: apps.length })
  } catch (error) {
    console.error('listApplications error:', error.message)
    res.status(500).json({ message: 'Server error' })
  }
}

async function authorizeAppAccess(app, req) {
  if (!app) return false
  if (req.user.role === 'administrator') return true
  if (req.user.role === 'citizen') return String(app.user) === String(req.user._id)
  // officers: view all applications of their own/any worklist
  return true
}

// GET /api/applications/:id
export async function getApplication(req, res) {
  try {
    const app = await Application.findById(req.params.id).lean()
    if (!app) return res.status(404).json({ message: 'Application not found' })
    if (!(await authorizeAppAccess(app, req))) return res.status(403).json({ message: 'Not permitted to view this application' })

    await recordAudit({ user: req.user, action: 'application.read', resource: 'application', resourceId: app.applicationId, result: 'success', ip: req.ip })
    res.json({ application: app })
  } catch (error) {
    console.error('getApplication error:', error.message)
    res.status(500).json({ message: 'Server error' })
  }
}

// PATCH /api/applications/:id/status — workflow-validated status change (officers/admin)
export async function updateStatus(req, res) {
  try {
    if (req.user.role === 'citizen') return res.status(403).json({ message: 'Citizens cannot change application status' })
    const { status, remarks } = req.body || {}
    if (!status) return res.status(400).json({ message: 'status is required' })

    const app = await Application.findById(req.params.id)
    if (!app) return res.status(404).json({ message: 'Application not found' })

    if (!canActOnDept(req.user.role, app.department)) {
      return res.status(403).json({
        message: `Only the ${deptLabel(req.user.role)} department can manage this ${app.department} application.`,
      })
    }
    if (app.status === 'APPROVED' || app.status === 'REJECTED' || app.status === 'CANCELLED') {
      return res.status(422).json({ message: `This application is already ${app.status.toLowerCase().replace(/_/g, ' ')} and cannot be changed.` })
    }

    const updated = await workflowService.transitionApplication(app, status, {
      user: req.user,
      remarks: remarks || '',
      actorRole: req.user.role,
      notifyMessage: `Application ${app.applicationId} moved to ${status.replace(/_/g, ' ').toLowerCase()}`,
    })
    res.json({ application: updated })
  } catch (error) {
    const status = error.status || 500
    res.status(status).json({ message: error.message || 'Server error' })
  }
}

// POST /api/applications/:id/approve
export async function approve(req, res) {
  try {
    if (req.user.role === 'citizen') return res.status(403).json({ message: 'Not permitted' })
    const app = await Application.findById(req.params.id)
    if (!app) return res.status(404).json({ message: 'Application not found' })

    if (!canActOnDept(req.user.role, app.department)) {
      return res.status(403).json({
        message: `Only the ${deptLabel(req.user.role)} department can approve this ${app.department} application.`,
      })
    }
    if (app.status === 'APPROVED') return res.status(422).json({ message: 'Application is already approved.' })
    if (app.status === 'REJECTED' || app.status === 'CANCELLED') {
      return res.status(422).json({ message: `Cannot approve an application that was ${app.status.toLowerCase().replace(/_/g, ' ')}.` })
    }
    if (!workflowService.isTransitionValid(app.status, 'APPROVED')) {
      return res.status(422).json({
        message: `Application must be reviewed before approval (current status: ${app.status.replace(/_/g, ' ').toLowerCase()}).`,
      })
    }

    const updated = await workflowService.transitionApplication(app, 'APPROVED', {
      user: req.user, remarks: req.body?.remarks || 'Approved by officer', actorRole: req.user.role,
      notifyMessage: `Your application ${app.applicationId} has been approved.`,
    })
    res.json({ application: updated })
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' })
  }
}

// POST /api/applications/:id/reject
export async function reject(req, res) {
  try {
    if (req.user.role === 'citizen') return res.status(403).json({ message: 'Not permitted' })
    const app = await Application.findById(req.params.id)
    if (!app) return res.status(404).json({ message: 'Application not found' })

    if (!canActOnDept(req.user.role, app.department)) {
      return res.status(403).json({
        message: `Only the ${deptLabel(req.user.role)} department can reject this ${app.department} application.`,
      })
    }
    if (app.status === 'REJECTED') return res.status(422).json({ message: 'Application is already rejected.' })
    if (app.status === 'APPROVED' || app.status === 'CANCELLED') {
      return res.status(422).json({ message: `Cannot reject an application that was ${app.status.toLowerCase().replace(/_/g, ' ')}.` })
    }

    const reason = req.body?.reason || 'Rejected by officer'
    app.reason = reason
    const updated = await workflowService.transitionApplication(app, 'REJECTED', {
      user: req.user, remarks: reason, actorRole: req.user.role,
      notifyMessage: `Your application ${app.applicationId} was rejected. Reason: ${reason}`,
    })
    res.json({ application: updated })
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' })
  }
}

// POST /api/applications/:id/assign
export async function assign(req, res) {
  try {
    if (req.user.role === 'citizen') return res.status(403).json({ message: 'Not permitted' })
    const app = await Application.findById(req.params.id)
    if (!app) return res.status(404).json({ message: 'Application not found' })
    const { officerId, officerName } = req.body || {}
    if (!officerName && officerId) {
      const officer = await User.findById(officerId).lean()
      if (officer) app.assigneeName = officer.name
      app.assignee = officerId
    } else if (officerName) {
      app.assigneeName = officerName
    }
    if (req.body?.department) app.department = req.body.department
    await app.save()
    await recordAudit({ user: req.user, action: 'application.assign', resource: 'application', resourceId: app.applicationId, result: 'success', metadata: { assignee: app.assigneeName, department: app.department }, ip: req.ip })
    await notify({ user: req.user, recipientRole: 'revenue_officer', title: 'Application assigned', message: `${app.applicationId} assigned to ${app.assigneeName || 'department'}`, link: '/applications', resource: 'application', resourceId: app.applicationId })
    res.json({ application: app })
  } catch (error) {
    console.error('assign error:', error.message)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/applications/:id/documents — add/upload a document reference
export async function addDocument(req, res) {
  try {
    const app = await Application.findById(req.params.id)
    if (!app) return res.status(404).json({ message: 'Application not found' })
    if (req.user.role === 'citizen' && String(app.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not permitted' })
    }
    const { name, type } = req.body || {}
    if (!name) return res.status(400).json({ message: 'document name is required' })
    app.documents = app.documents || []
    app.documents.push({ name, type: type || 'generic', status: 'uploaded', url: req.body?.url || '' })
    await app.save()
    await recordAudit({ user: req.user, action: 'application.document', resource: 'application', resourceId: app.applicationId, result: 'success', metadata: { document: name }, ip: req.ip })
    res.json({ application: app })
  } catch (error) {
    console.error('addDocument error:', error.message)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/applications/:id/ai-review — run AI assistant on the application
export async function runAiReview(req, res) {
  try {
    const app = await Application.findById(req.params.id)
    if (!app) return res.status(404).json({ message: 'Application not found' })
    const ai = await aiService.applicationAssistant({ application: app.toObject() })
    app.aiReview = {
      summary: ai.summary,
      issues: (ai.findings || []).map((f) => f.message),
      confidence: ai.confidence,
      recommendedAction: ai.recommendedAction,
      generatedAt: new Date(),
    }
    await app.save()
    await recordAudit({ user: req.user, action: 'application.ai_review', resource: 'application', resourceId: app.applicationId, result: 'success', metadata: { confidence: ai.confidence, recommendedAction: ai.recommendedAction }, ip: req.ip })
    res.json({ aiReview: app.aiReview, report: ai })
  } catch (error) {
    console.error('aiReview error:', error.message)
    res.status(500).json({ message: 'Server error' })
  }
}

export const applicationController = {
  createApplication, listApplications, getApplication, updateStatus, approve, reject, assign, addDocument, runAiReview,
}
export default applicationController

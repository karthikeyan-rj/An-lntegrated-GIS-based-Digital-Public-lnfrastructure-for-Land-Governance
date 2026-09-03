import { useState, useRef, useEffect } from 'react'
import { Send, X, MessageSquareText, Bot, User, Sparkles, Loader2, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  source?: 'gemini' | 'demo'
  time: string
}

let msgCounter = 0
function nextId() {
  msgCounter += 1
  return `msg-${Date.now()}-${msgCounter}`
}

/** Local demo fallback (used when there is no backend token / in demo mode). */
function demoReply(question: string): string {
  const q = question.toLowerCase()
  if (/mutation|apply/.test(q)) {
    return 'To apply for mutation, provide the sale deed, encumbrance certificate and identity proof. Submit via Citizen Services and track it by application ID.'
  }
  if (/encumbrance/.test(q)) {
    return 'An encumbrance certificate states whether a property is free from mortgages/liens. Verify the parcel encumbrance record with the sub-registrar office.'
  }
  if (/tax/.test(q)) {
    return 'Property tax status is shown on each parcel record. Outstanding tax can affect transactions, so a tax clearance certificate may be required before registration.'
  }
  if (/gis|map|layer/.test(q)) {
    return 'The GIS Explorer lets you search the map by ULPIN, survey number, village or district and inspect parcel layers, boundaries and governance data.'
  }
  if (/application|status/.test(q)) {
    return 'You can track applications in the Applications page, or via the My Applications widget. Each status reflects the current workflow stage.'
  }
  if (/doc/.test(q)) {
    return 'Required documents vary by service. Common ones are title deed, survey record, encumbrance certificate and identity proof.'
  }
  if (/hi|hello|hey/.test(q)) {
    return 'Hello! I can help with land records, applications, mutation, tax, encumbrance and GIS questions across LandStack.'
  }
  return 'I can help with LandStack services — records, applications, mutation, tax and GIS. For legal or high-impact decisions, please verify with the responsible department or an authorized official.'
}

function parseAssistantReply(res: any): { text: string; source: 'gemini' | 'demo' } {
  const text =
    res?.answer ||
    res?.summary ||
    res?.recommendation ||
    res?.recommendedAction ||
    (Array.isArray(res?.findings) && res.findings.length
      ? res.findings.map((f: any) => (typeof f === 'string' ? f : f.message || f.description || '')).join(' ')
      : '')
  const source: 'gemini' | 'demo' = res?.provider === 'gemini' ? 'gemini' : 'demo'
  const cleaned = String(text).replace(/^AI[_ ]?ASSISTED/i, '').trim()
  return { text: cleaned, source }
}

export function ChatAssistant() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages((m) => [...m, { id: nextId(), role: 'user', text, time: new Date().toISOString() }])
    setLoading(true)

    const context = user
      ? { user: { name: user.name, role: user.role, department: user.department } }
      : {}
    let reply: { text: string; source: 'gemini' | 'demo' }
    try {
      const res = await api.aiChat(text, context)
      reply = parseAssistantReply(res)
      if (!reply.text) reply = { text: demoReply(text), source: 'demo' }
    } catch {
      reply = { text: demoReply(text), source: 'demo' }
    }

    setMessages((m) => [...m, { id: nextId(), role: 'assistant', text: reply.text, source: reply.source, time: new Date().toISOString() }])
    setLoading(false)
  }

  return (
    <>
      {/* Floating launch button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-gov-600 text-white shadow-lg hover:bg-gov-700 transition-all px-4 py-3"
          aria-label="Open chat assistant"
        >
          <MessageSquareText className="w-5 h-5" />
          <span className="hidden sm:inline text-sm font-semibold">Ask LandStack AI</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 bg-gov-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">LandStack AI Assistant</p>
                <p className="text-[10px] text-gov-100">Helps with land records, services &amp; GIS</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-white/15" aria-label="Close chat">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="max-h-80 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {messages.length === 0 && !loading && (
              <div className="flex items-start gap-2">
                <Bot className="mt-0.5 h-5 w-5 flex-shrink-0 text-gov-500" />
                <div className="rounded-xl rounded-tl-sm bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">
                  Hi {user?.name?.split(' ')[0] || 'there'}! Ask me about land records, mutations, encumbrances, tax, applications or the GIS map. Responses are AI-assistive.
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={cn('flex items-start gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                {m.role === 'assistant' && <Bot className="mt-0.5 h-5 w-5 flex-shrink-0 text-gov-500" />}
                {m.role === 'user' && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gov-600">
                    <User className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className={cn('max-w-[80%] rounded-xl px-3 py-2 text-xs shadow-sm', m.role === 'user' ? 'rounded-tr-sm bg-gov-600 text-white' : 'rounded-tl-sm bg-white text-slate-700')}>
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                  {(m.role === 'assistant') && m.source && (
                    <span className={cn('mt-1.5 inline-flex items-center gap-1 text-[9px] font-medium', m.source === 'gemini' ? 'text-emerald-600' : 'text-amber-600')}>
                      <Sparkles className="h-2.5 w-2.5" />
                      {m.source === 'gemini' ? 'Powered by Gemini' : 'Demo reasoning (no session token)'}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-2">
                <Bot className="mt-0.5 h-5 w-5 flex-shrink-0 text-gov-500" />
                <div className="flex items-center gap-1.5 rounded-xl rounded-tl-sm bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Thinking…
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 bg-white p-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') send() }}
                placeholder="Ask about parcels, applications, tax…"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-gov-500"
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gov-600 text-white hover:bg-gov-700 disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 flex items-center gap-1 text-[9px] text-slate-400">
              <AlertTriangle className="h-2.5 w-2.5" />
              AI outputs are assistive and require verification by an authorized official.
            </p>
          </div>
        </div>
      )}
    </>
  )
}

"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Globe, Mail, FileText, Shield, Network, Search,
  Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp,
  ShieldAlert, ShieldCheck, Info, Wifi, MapPin
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// ── Types ──────────────────────────────────────────────────────────────────

type ScanStatus = "idle" | "scanning" | "polling" | "success" | "error"

interface ModuleResult {
  module: string
  status: "ok" | "warning" | "critical" | "error" | "info"
  findings: string[]
  details: Record<string, unknown>
  vulnerable?: boolean
}

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  ok:       "bg-green-500/10 text-green-400 border-green-500/30",
  warning:  "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  critical: "bg-red-500/10 text-red-400 border-red-500/30",
  error:    "bg-gray-500/10 text-gray-400 border-gray-500/30",
  info:     "bg-blue-500/10 text-blue-400 border-blue-500/30",
}

const MODULE_ICONS: Record<string, React.ElementType> = {
  ssl:     Shield,
  headers: ShieldCheck,
  sqli:    ShieldAlert,
  xss:     AlertCircle,
  csrf:    ShieldAlert,
  whois:   Globe,
  nmap:    Wifi,
  ipGeo:   MapPin,
}

const MODULE_LABELS: Record<string, string> = {
  ssl:     "SSL Certificate",
  headers: "HTTP Headers",
  sqli:    "SQL Injection",
  xss:     "XSS Detection",
  csrf:    "CSRF Protection",
  whois:   "WHOIS Lookup",
  nmap:    "Port Scan",
  ipGeo:   "IP Geolocation",
}

// ── ResultCard ─────────────────────────────────────────────────────────────

function ResultCard({ moduleKey, result }: { moduleKey: string; result: ModuleResult }) {
  const [expanded, setExpanded] = useState(false)

  // Guard: skip non-module entries (riskScore, riskLevel, etc.)
  if (!result || typeof result !== "object" || !result.status) return null

  const Icon = MODULE_ICONS[moduleKey] || Info
  const label = MODULE_LABELS[moduleKey] || moduleKey.toUpperCase()
  const colorClass = STATUS_COLORS[result.status] || STATUS_COLORS.info
  const findings = Array.isArray(result.findings) ? result.findings : []

  return (
    <div className={`rounded-lg border p-4 ${colorClass}`}>
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span className="font-medium text-sm">{label}</span>
          <Badge variant="outline" className={`text-xs ${colorClass}`}>
            {(result.status || "info").toUpperCase()}
          </Badge>
        </div>
        {expanded
          ? <ChevronUp className="h-4 w-4" />
          : <ChevronDown className="h-4 w-4" />}
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <ul className="mt-3 space-y-1.5 pl-1">
              {findings.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs opacity-90">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                  {f}
                </li>
              ))}
            </ul>
            {result.details && Object.keys(result.details).length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs opacity-60 hover:opacity-100">
                  Raw details
                </summary>
                <pre className="mt-2 overflow-x-auto rounded bg-black/20 p-2 text-xs">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {!expanded && (
        <p className="mt-1 text-xs opacity-70 truncate">
          {findings[0] || "No findings"}
        </p>
      )}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function overallSeverity(modules: Record<string, ModuleResult>): string {
  const statuses = Object.values(modules)
    .filter((r) => r && typeof r === "object" && r.status)
    .map((r) => r.status)
  if (statuses.includes("critical")) return "critical"
  if (statuses.includes("warning"))  return "warning"
  if (statuses.includes("error"))    return "error"
  return "ok"
}

// ── ScanForm ───────────────────────────────────────────────────────────────

export function ScanForm() {
  const [status, setStatus] = useState<ScanStatus>("idle")
  const [message, setMessage] = useState("")
  // scanModules holds only the modules map: { ssl: {...}, headers: {...}, ... }
  const [scanModules, setScanModules] = useState<Record<string, ModuleResult> | null>(null)
  const [formData, setFormData] = useState({
    target:      "",
    email:       "",
    consentText: "",
    consent:     false,
    runWhois:    false,
    runNmap:     false,
  })

  const pollForResults = async (scanId: string) => {
    setStatus("polling")
    const maxAttempts = 60
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 4000))
      try {
        const res = await fetch(`/api/scan/${scanId}`)
        const data = await res.json()
        if (data.status === "done" || data.status === "failed") {
          // data.results has shape: { modules: {...}, riskScore, riskLevel, ... }
          const modules = data.results?.modules
          if (modules && typeof modules === "object") {
            setScanModules(modules)
            setStatus("success")
            setMessage("Scan complete! View full details on the Dashboard.")
          } else {
            setStatus("error")
            setMessage("Scan failed or returned no data. Try again.")
          }
          return
        }
      } catch {
        // keep polling
      }
    }
    setStatus("error")
    setMessage("Scan is still running — check Dashboard for results!")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setScanModules(null)

    if (!formData.target.startsWith("http://") && !formData.target.startsWith("https://")) {
      setStatus("error")
      setMessage("Please enter a valid URL starting with http:// or https://")
      return
    }
    if (!formData.consent || !formData.consentText.trim()) {
      setStatus("error")
      setMessage("You must provide consent details and check the permission box")
      return
    }

    setStatus("scanning")
    setMessage("Submitting scan...")

    try {
      const res = await fetch("/api/scan", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target:       formData.target.trim(),
          email:        formData.email.trim() || null,
          consent:      formData.consent,
          consent_text: formData.consentText.trim(),
          run_whois:    formData.runWhois,
          run_nmap:     formData.runNmap,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus("error")
        setMessage(data.detail || "An error occurred")
        return
      }
      setMessage("Scanning in progress… SSL, Headers, SQLi, XSS, CSRF, IP Geo (~30–90s)")
      pollForResults(data.scan_id)
    } catch {
      setStatus("error")
      setMessage("Cannot connect to backend. Make sure the Python backend is running on port 8000.")
    }
  }

  const severity = scanModules ? overallSeverity(scanModules) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Search className="h-5 w-5 text-primary" />
            New Scan
          </CardTitle>
          <CardDescription>
            Enter the target URL and configure your scan options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Target URL */}
            <div className="space-y-2">
              <Label htmlFor="target" className="flex items-center gap-2 text-sm font-medium">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Target URL
              </Label>
              <Input
                id="target"
                type="url"
                placeholder="https://example.com"
                required
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                className="bg-input/50"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email (optional)
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-input/50"
              />
            </div>

            {/* Consent text */}
            <div className="space-y-2">
              <Label htmlFor="consent-text" className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Consent Details
              </Label>
              <Textarea
                id="consent-text"
                placeholder="Describe your authorization to scan this target (e.g. I own this website)..."
                required
                rows={3}
                value={formData.consentText}
                onChange={(e) => setFormData({ ...formData, consentText: e.target.value })}
                className="bg-input/50 resize-none"
              />
            </div>

            {/* Options */}
            <div className="space-y-3 rounded-lg border border-border/50 bg-secondary/30 p-4">
              <p className="text-sm font-medium text-foreground">Scan Options</p>
              <div className="flex flex-col gap-3">
                <label className="flex cursor-pointer items-center gap-3">
                  <Checkbox
                    id="consent"
                    checked={formData.consent}
                    onCheckedChange={(c) => setFormData({ ...formData, consent: c })}
                  />
                  <span className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-primary" />
                    I have permission to scan this site *
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-3">
                  <Checkbox
                    id="whois"
                    checked={formData.runWhois}
                    onCheckedChange={(c) => setFormData({ ...formData, runWhois: c })}
                  />
                  <span className="flex items-center gap-2 text-sm">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    Run WHOIS lookup
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-3">
                  <Checkbox
                    id="nmap"
                    checked={formData.runNmap}
                    onCheckedChange={(c) => setFormData({ ...formData, runNmap: c })}
                  />
                  <span className="flex items-center gap-2 text-sm">
                    <Network className="h-4 w-4 text-muted-foreground" />
                    Run port scan (Nmap)
                  </span>
                </label>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full font-medium"
              disabled={status === "scanning" || status === "polling"}
              size="lg"
            >
              {status === "scanning" || status === "polling" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {status === "scanning" ? "Submitting..." : "Scanning… (takes ~30–90s)"}
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Start Scan
                </>
              )}
            </Button>

            {/* Status message */}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                  status === "success"
                    ? "bg-green-500/10 text-green-400"
                    : status === "polling" || status === "scanning"
                    ? "bg-primary/10 text-primary"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {status === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : status === "polling" || status === "scanning" ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                {message}
              </motion.div>
            )}
          </form>

          {/* Results */}
          <AnimatePresence>
            {scanModules && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Scan Results</h3>
                  <Badge
                    variant="outline"
                    className={STATUS_COLORS[severity || "ok"]}
                  >
                    Overall: {(severity || "ok").toUpperCase()}
                  </Badge>
                </div>
                {Object.entries(scanModules).map(([key, result]) => (
                  <ResultCard key={key} moduleKey={key} result={result} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}

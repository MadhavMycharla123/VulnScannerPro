"use client"
import { useEffect, useState, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  Shield, ShieldAlert, ShieldCheck, Globe, Wifi, AlertCircle,
  CheckCircle2, XCircle, Clock, Loader2, FileDown, ArrowLeft,
  Info, Lock, Bug, Zap, MapPin, ChevronDown, ChevronUp, RefreshCw
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const SMAP: Record<string,any> = {
  ok:       { bg:"bg-green-500/10",  text:"text-green-400",  border:"border-green-500/30",  label:"SAFE"     },
  warning:  { bg:"bg-yellow-500/10", text:"text-yellow-400", border:"border-yellow-500/30", label:"WARNING"  },
  critical: { bg:"bg-red-500/10",    text:"text-red-400",    border:"border-red-500/30",    label:"CRITICAL" },
  error:    { bg:"bg-gray-500/10",   text:"text-gray-400",   border:"border-gray-500/30",   label:"ERROR"    },
  info:     { bg:"bg-blue-500/10",   text:"text-blue-400",   border:"border-blue-500/30",   label:"INFO"     },
}
const MMETA: Record<string,any> = {
  ssl:     { label:"SSL Certificate",  icon:Lock,        desc:"Certificate validity, TLS version & expiry" },
  headers: { label:"HTTP Headers",     icon:ShieldCheck, desc:"Security headers presence and configuration" },
  sqli:    { label:"SQL Injection",    icon:Bug,         desc:"Database injection attack testing" },
  xss:     { label:"XSS Detection",   icon:Zap,         desc:"Reflected cross-site scripting" },
  csrf:    { label:"CSRF Protection",  icon:ShieldAlert, desc:"Cross-site request forgery tokens" },
  ipGeo:   { label:"IP Geolocation",  icon:MapPin,      desc:"Server location and ISP info" },
  whois:   { label:"WHOIS Lookup",    icon:Globe,       desc:"Domain registration info" },
  nmap:    { label:"Port Scan",       icon:Wifi,        desc:"Open ports and exposed services" },
}
const PMAP: Record<string,string> = {
  Critical:"bg-red-500/20 text-red-400 border-red-500/30",
  High:    "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Medium:  "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Low:     "bg-green-500/20 text-green-400 border-green-500/30",
}

// Correct max points per category for accurate bar widths
const DEFAULT_CAPS: Record<string,number> = {
  sqlInjection: 30, xss: 25, csrf: 15, headers: 20, ssl: 15, ports: 10,
}

function fmt(d:string|null){
  if(!d) return "—"
  return new Date(d).toLocaleString("en-US",{month:"short",day:"numeric",
    year:"numeric",hour:"2-digit",minute:"2-digit"})
}

function ModCard({k,r}:{k:string,r:any}){
  const [open,setOpen]=useState(true)
  const meta=MMETA[k]||{label:k,icon:Info,desc:""}
  const s=SMAP[r.status]||SMAP.info
  const Icon=meta.icon
  return (
    <Card className={`border ${s.border} ${s.bg}`}>
      <CardHeader className="pb-2 cursor-pointer" onClick={()=>setOpen(!open)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.bg} border ${s.border}`}>
              <Icon className={`h-4 w-4 ${s.text}`}/>
            </div>
            <div>
              <CardTitle className={`text-sm ${s.text}`}>{meta.label}</CardTitle>
              <p className="text-xs text-muted-foreground">{meta.desc}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${s.bg} ${s.text} ${s.border} font-bold text-xs`}>
              {s.label}
            </Badge>
            {open?<ChevronUp className="h-4 w-4 text-muted-foreground"/>
                 :<ChevronDown className="h-4 w-4 text-muted-foreground"/>}
          </div>
        </div>
      </CardHeader>
      {open && (
        <CardContent className="space-y-3">
          <ul className="space-y-1">
            {r.findings?.map((f:string,i:number)=>(
              <li key={i} className={`flex items-start gap-2 text-xs ${s.text}`}>
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current"/>
                {f}
              </li>
            ))}
          </ul>
          {/* Missing headers table */}
          {k==="headers" && r.details?.missing_headers?.length>0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Missing Headers ({r.details.missing_headers.length})
              </p>
              <div className="space-y-1">
                {r.details.missing_headers.map((h:any,i:number)=>(
                  <div key={i} className="flex items-center justify-between rounded bg-black/20 px-3 py-1 text-xs">
                    <span className="font-mono text-red-400">{h.name}</span>
                    <span className="text-muted-foreground hidden sm:block">{h.desc}</span>
                    <Badge variant="outline" className={`text-xs ${
                      h.severity==="high"?"text-red-400 border-red-500/30":
                      h.severity==="medium"?"text-yellow-400 border-yellow-500/30":
                      "text-gray-400 border-gray-500/30"}`}>{h.severity}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Open ports */}
          {k==="nmap" && r.details?.open_ports?.length>0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Open Ports ({r.details.open_ports.length})
              </p>
              <div className="space-y-1">
                {r.details.open_ports.map((p:any,i:number)=>(
                  <div key={i} className="flex items-center gap-4 rounded bg-black/20 px-3 py-1 text-xs">
                    <span className="font-mono text-yellow-400 w-12">{p.port}</span>
                    <span className="text-muted-foreground">{p.service}</span>
                    <Badge variant="outline" className="text-green-400 border-green-500/30 text-xs">{p.state}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* IP Geo map link */}
          {k==="ipGeo" && r.details?.lat && (
            <a href={`https://maps.google.com/?q=${r.details.lat},${r.details.lon}`}
               target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline">
              <MapPin className="h-3 w-3"/>
              View on Google Maps
            </a>
          )}
        </CardContent>
      )}
    </Card>
  )
}

function RiskGauge({score,level,color}:{score:number,level:string,color:string}){
  const [animated, setAnimated] = useState(0)
  useEffect(()=>{
    const t = setTimeout(()=>setAnimated(score), 300)
    return ()=>clearTimeout(t)
  },[score])
  const r=54, c=2*Math.PI*r, dash=(animated/100)*c
  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#1f2937" strokeWidth="12"/>
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={`${dash} ${c}`}
          strokeDashoffset={c/4}
          strokeLinecap="round"
          style={{transition:"stroke-dasharray 1s ease"}}/>
        <text x="70" y="65" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold">
          {score}
        </text>
        <text x="70" y="85" textAnchor="middle" fill="#9ca3af" fontSize="11">
          / 100
        </text>
      </svg>
      <div className="text-center">
        <p className="text-lg font-bold" style={{color}}>{level}</p>
        <p className="text-xs text-muted-foreground">AI Risk Score</p>
      </div>
    </div>
  )
}

function generatePDF(scan:any){
  const r=scan.results||{}
  const modules=r.modules||{}
  const recs=r.recommendations||[]
  const score=r.riskScore??0
  const level=r.riskLevel??"UNKNOWN"
  const color=r.riskColor??"#888"

  const modHTML=Object.entries(modules).map(([k,mod]:any)=>{
    const meta=MMETA[k]||{label:k}
    const s=SMAP[mod.status]||SMAP.info
    const findingsHTML=mod.findings?.map((f:string)=>`<li style="color:#ccc;margin:3px 0">• ${f}</li>`).join("")||""
    return `
      <div style="margin-bottom:20px;border:1px solid #333;border-radius:8px;padding:14px;background:#111">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <strong style="color:#fff;font-size:14px">${meta.label}</strong>
          <span style="padding:3px 8px;border-radius:4px;font-size:11px;font-weight:bold;
            background:${mod.status==="critical"?"#3f1010":mod.status==="warning"?"#3f3010":mod.status==="ok"?"#103f10":"#222"};
            color:${mod.status==="critical"?"#f87171":mod.status==="warning"?"#fbbf24":mod.status==="ok"?"#4ade80":"#aaa"}">
            ${(s.label||mod.status).toUpperCase()}
          </span>
        </div>
        <ul style="margin:0;padding:0;list-style:none">${findingsHTML}</ul>
      </div>`
  }).join("")

  const recsHTML=recs.map((rc:any)=>`
    <div style="margin-bottom:14px;border:1px solid #2d3a1e;border-radius:6px;padding:12px;background:#111">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <strong style="color:#fff;font-size:13px">${rc.title}</strong>
        <span style="padding:2px 8px;border-radius:4px;font-size:10px;
          background:${rc.priority==="Critical"?"#3f1010":rc.priority==="High"?"#3f2010":"#3f3010"};
          color:${rc.priority==="Critical"?"#f87171":rc.priority==="High"?"#fb923c":"#fbbf24"}">
          ${rc.priority}
        </span>
      </div>
      <p style="color:#9ca3af;font-size:12px;margin:0 0 6px">${rc.fix}</p>
      <a href="${rc.reference}" style="color:#60a5fa;font-size:11px">${rc.reference}</a>
    </div>`
  ).join("")

  const html=`<!DOCTYPE html><html>
<head><meta charset="UTF-8"><title>VulnScanner Pro Report — ${scan.target}</title>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;background:#0a0a0a;color:#fff;margin:0;padding:28px}
  @media print{body{padding:10px}}
</style>
</head><body>
  <div style="border-bottom:1px solid #333;padding-bottom:20px;margin-bottom:28px;display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      <div style="color:#0ea5e9;font-size:12px;font-weight:bold;margin-bottom:6px">🛡 VULNSCANNER PRO — SECURITY REPORT v2.0</div>
      <h1 style="margin:0 0 6px;font-size:20px;word-break:break-all">${scan.target}</h1>
      <p style="color:#888;font-size:12px;margin:2px 0">ID: ${scan.id}</p>
      <p style="color:#888;font-size:12px;margin:2px 0">Started: ${fmt(scan.created_at)} | Finished: ${fmt(scan.finished_at)}</p>
      ${scan.user_email?`<p style="color:#888;font-size:12px;margin:2px 0">Analyst: ${scan.user_email}</p>`:""}
      <p style="color:#888;font-size:12px;margin:8px 0 0">Student: MYCHARLA MADHAVKUMAR | GITAM University | MCA | Roll: 324227760022</p>
    </div>
    <div style="text-align:center;min-width:100px">
      <div style="font-size:40px;font-weight:900;color:${color}">${score}</div>
      <div style="font-size:13px;font-weight:bold;color:${color}">${level} RISK</div>
      <div style="font-size:11px;color:#888">AI Risk Score / 100</div>
    </div>
  </div>
  <h2 style="font-size:16px;margin:0 0 14px;color:#e5e7eb">Scan Results</h2>
  ${modHTML}
  ${recs.length>0?`<h2 style="font-size:16px;margin:24px 0 14px;color:#e5e7eb">AI Recommendations (${recs.length})</h2>${recsHTML}`:""}
  <div style="margin-top:28px;border-top:1px solid #333;padding-top:14px;text-align:center;font-size:11px;color:#555">
    Generated by VulnScanner Pro v2.0 • ${new Date().toLocaleString()} • Scan responsibly. © MYCHARLA MADHAVKUMAR | GITAM MCA
  </div>
</body></html>`

  const blob=new Blob([html],{type:"text/html"})
  const url=URL.createObjectURL(blob)
  const w=window.open(url,"_blank")
  if(w) setTimeout(()=>w.print(),700)
}

export default function ScanDetailPage(){
  const {id}=useParams()
  const [scan,setScan]=useState<any>(null)
  const [loading,setLoading]=useState(true)
  const [pollingMsg,setPollingMsg]=useState("")
  const intervalRef=useRef<ReturnType<typeof setInterval>|null>(null)

  const fetchScan = useCallback(async () => {
    if(!id) return
    try {
      const res = await fetch(`/api/scan/${id}`)
      if(!res.ok) { setLoading(false); return }
      const data = await res.json()
      setScan(data)
      setLoading(false)
      // Stop polling once scan is finished
      if(data.status === "done" || data.status === "failed") {
        setPollingMsg("")
        if(intervalRef.current) clearInterval(intervalRef.current)
      }
    } catch {
      setLoading(false)
    }
  }, [id])

  useEffect(()=>{
    fetchScan()
  },[fetchScan])

  // Start auto-polling if scan is still running
  useEffect(()=>{
    if(!scan) return
    if(scan.status === "running" || scan.status === "queued") {
      setPollingMsg("Scan in progress — auto-refreshing every 5 seconds…")
      intervalRef.current = setInterval(fetchScan, 5000)
    }
    return () => { if(intervalRef.current) clearInterval(intervalRef.current) }
  },[scan?.status, fetchScan])

  if(loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary"/>
      <p className="text-sm text-muted-foreground">Loading scan…</p>
    </div>
  )
  if(!scan) return (
    <div className="min-h-screen flex items-center justify-center text-destructive">
      Scan not found
    </div>
  )

  const r=scan.results||{}
  const modules=r.modules||{}
  const recs=r.recommendations||[]
  const score=r.riskScore??0
  const level=r.riskLevel??"UNKNOWN"
  const color=r.riskColor??"#888"
  const breakdown=r.scoreBreakdown||{}
  // Use caps from backend if available, otherwise fall back to defaults
  const caps:Record<string,number> = r.scoreCaps || DEFAULT_CAPS

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/20 blur-[120px]"/>
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-[120px]"/>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary"/>
            <span className="font-bold">VulnScanner Pro</span>
          </div>
          <div className="flex gap-3">
            <Link href="/"><Button variant="ghost" size="sm">Home</Button></Link>
            <Link href="/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link>
          </div>
        </div>
      </nav>

      <main className="relative mx-auto max-w-6xl px-4 py-8">
        {/* Back + PDF */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4"/> Back
            </Button>
          </Link>
          <div className="flex gap-2">
            {(scan.status === "running" || scan.status === "queued") && (
              <Button variant="outline" size="sm" className="gap-2" onClick={fetchScan}>
                <RefreshCw className="h-4 w-4"/> Refresh
              </Button>
            )}
            {scan.status === "done" && (
              <Button onClick={()=>generatePDF(scan)} className="gap-2">
                <FileDown className="h-4 w-4"/> Download PDF Report
              </Button>
            )}
          </div>
        </div>

        {/* Polling banner */}
        {pollingMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary">
            <Loader2 className="h-4 w-4 animate-spin shrink-0"/>
            {pollingMsg}
          </div>
        )}

        {/* Header + AI Score */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Target info */}
          <Card className="lg:col-span-2 border-border/50 bg-card/50">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-1">SCAN TARGET</p>
              <h1 className="text-xl font-bold break-all mb-1">{scan.target}</h1>
              <p className="text-xs text-muted-foreground mb-4">ID: {scan.id}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {label:"Status", value:scan.status, icon:
                    scan.status==="done"?<CheckCircle2 className="h-4 w-4 text-green-400"/>:
                    scan.status==="running"||scan.status==="queued"?<Loader2 className="h-4 w-4 animate-spin text-primary"/>:
                    <XCircle className="h-4 w-4 text-red-400"/>},
                  {label:"Modules", value:Object.keys(modules).length},
                  {label:"Critical", value:Object.values(modules).filter((m:any)=>m.status==="critical").length},
                  {label:"Warnings", value:Object.values(modules).filter((m:any)=>m.status==="warning").length},
                ].map((item,i)=>(
                  <div key={i}>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {item.icon}
                      <span className="text-sm font-semibold capitalize">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/40">
                <div><p className="text-xs text-muted-foreground">Started</p><p className="text-xs mt-1">{fmt(scan.created_at)}</p></div>
                <div><p className="text-xs text-muted-foreground">Finished</p><p className="text-xs mt-1">{fmt(scan.finished_at)}</p></div>
              </div>
            </CardContent>
          </Card>

          {/* AI Risk Score — only shown when done */}
          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-6 flex flex-col items-center">
              {scan.status === "done" ? (
                <>
                  <RiskGauge score={score} level={level} color={color}/>
                  {/* Breakdown bars — each uses its own correct cap */}
                  <div className="w-full mt-4 space-y-2">
                    {Object.entries(breakdown).map(([k,v]:any)=>{
                      const cap = caps[k] ?? 30
                      const pct = cap > 0 ? Math.min((v/cap)*100, 100) : 0
                      return (
                        <div key={k} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-24 capitalize">{k}</span>
                          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{width:`${pct}%`,
                                background:v>=cap*0.7?"#dc2626":v>=cap*0.4?"#d97706":"#16a34a"}}/>
                          </div>
                          <span className="text-xs text-muted-foreground w-10 text-right">{v}/{cap}</span>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-primary"/>
                  <p className="text-sm text-muted-foreground text-center">
                    {scan.status === "queued" ? "Scan queued…" : "Scan running…"}
                  </p>
                  <p className="text-xs text-muted-foreground text-center">Results appear here when complete</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Module Results */}
        {Object.keys(modules).length > 0 && (
          <>
            <h2 className="text-base font-semibold mb-3">Detailed Scan Results</h2>
            <div className="space-y-3 mb-8">
              {Object.entries(modules).map(([k,mod])=>(
                <ModCard key={k} k={k} r={mod}/>
              ))}
            </div>
          </>
        )}

        {/* AI Recommendations */}
        {recs.length>0 && (
          <div>
            <h2 className="text-base font-semibold mb-3">AI Recommendations ({recs.length})</h2>
            <div className="space-y-3">
              {recs.map((rec:any,i:number)=>(
                <Card key={i} className="border-border/50 bg-card/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold">{rec.title}</h3>
                      <Badge variant="outline" className={`text-xs ${PMAP[rec.priority]||""}`}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{rec.fix}</p>
                    <a href={rec.reference} target="_blank" rel="noopener noreferrer"
                       className="text-xs text-blue-400 hover:underline break-all">
                      {rec.reference}
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <footer className="mt-12 border-t border-border/40 pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © 2026 VulnScanner Pro • MYCHARLA MADHAVKUMAR • GITAM University MCA • Roll: 324227760022 • Scan responsibly.
          </p>
        </footer>
      </main>
    </div>
  )
}

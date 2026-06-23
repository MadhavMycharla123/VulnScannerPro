"use client"
import { motion } from "framer-motion"
import { ExternalLink, Clock, CheckCircle2, XCircle, Loader2, ShieldAlert, ShieldCheck, Eye } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"

export interface Scan {
  id: string; target: string; user_email: string | null
  status: "done"|"queued"|"failed"|"running"
  created_at: string; finished_at: string | null
  results?: any
}

function StatusBadge({ status }: { status: Scan["status"] }) {
  const cfg: Record<string,any> = {
    done:    { label:"Completed", icon:CheckCircle2, cls:"bg-green-500/10 text-green-400 border-green-500/20" },
    queued:  { label:"Queued",    icon:Clock,        cls:"bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse" },
    running: { label:"Running",   icon:Loader2,      cls:"bg-primary/10 text-primary border-primary/20" },
    failed:  { label:"Failed",    icon:XCircle,      cls:"bg-red-500/10 text-red-400 border-red-500/20" },
  }
  const { label, icon: Icon, cls } = cfg[status] || cfg.queued
  return (
    <Badge variant="outline" className={`gap-1.5 ${cls}`}>
      <Icon className={`h-3 w-3 ${status==="running"?"animate-spin":""}`}/>{label}
    </Badge>
  )
}

function RiskBadge({ results }: { results?: any }) {
  if (!results?.modules) return <span className="text-muted-foreground text-xs">—</span>
  const mods = Object.values(results.modules) as any[]
  const score = results.riskScore ?? 0
  const level = results.riskLevel ?? ""
  const color = results.riskColor ?? "#888"
  if (level === "CRITICAL" || mods.some(m => m.status === "critical"))
    return <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 gap-1">
      <ShieldAlert className="h-3 w-3"/> Critical {score>0?`(${score})`:""}</Badge>
  if (level === "HIGH")
    return <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30 gap-1">
      <ShieldAlert className="h-3 w-3"/> High ({score})</Badge>
  if (level === "MEDIUM" || mods.some(m => m.status === "warning"))
    return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 gap-1">
      <ShieldAlert className="h-3 w-3"/> Medium {score>0?`(${score})`:""}</Badge>
  return <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 gap-1">
    <ShieldCheck className="h-3 w-3"/> Low {score>0?`(${score})`:""}</Badge>
}

function fmtDate(d: string|null) {
  if (!d) return "—"
  return new Date(d).toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})
}

export function ScansTable({ scans, isLoading }: { scans: Scan[]; isLoading: boolean }) {
  const router = useRouter()
  return (
    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.5,delay:0.3}}>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Recent Scans</CardTitle>
              <CardDescription>Click any row to view full results & download PDF report</CardDescription>
            </div>
            {isLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin"/><span>Refreshing...</span>
            </div>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border/50 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                  {["ID","Target","AI Risk","Status","Created","Finished","Actions"].map(h=>(
                    <TableHead key={h} className="font-semibold">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {scans.length===0 ? (
                  <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No scans yet. Submit your first scan from the home page.
                  </TableCell></TableRow>
                ) : scans.map((scan,i)=>(
                  <motion.tr key={scan.id}
                    initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}}
                    transition={{duration:0.3,delay:i*0.04}}
                    className="group border-b border-border/30 hover:bg-secondary/20 cursor-pointer transition-colors"
                    onClick={()=>router.push(`/scan/${scan.id}`)}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {scan.id.slice(0,8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 max-w-[200px]">
                        <span className="truncate text-sm">{scan.target}</span>
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 shrink-0"/>
                      </div>
                    </TableCell>
                    <TableCell><RiskBadge results={scan.results}/></TableCell>
                    <TableCell><StatusBadge status={scan.status}/></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(scan.created_at)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(scan.finished_at)}</TableCell>
                    <TableCell onClick={e=>e.stopPropagation()}>
                      <Button size="sm" variant="outline" className="gap-1 h-7 text-xs"
                        onClick={()=>router.push(`/scan/${scan.id}`)}
                        disabled={scan.status!=="done"}>
                        <Eye className="h-3 w-3"/>View
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

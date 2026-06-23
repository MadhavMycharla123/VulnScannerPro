"use client"
import { motion } from "framer-motion"
import { Activity, CheckCircle2, Clock, XCircle, ShieldAlert } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface Stats {
  total: number
  completed: number
  queued: number
  failed: number
}

interface Props {
  stats: Stats
}

export function StatsCards({ stats }: Props) {
  const cards = [
    { label: "Total Scans",   value: stats.total,     icon: Activity,     color: "text-primary",    bg: "bg-primary/10" },
    { label: "Completed",     value: stats.completed, icon: CheckCircle2, color: "text-green-400",  bg: "bg-green-500/10" },
    { label: "In Progress",   value: stats.queued,    icon: Clock,        color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: "Failed",        value: stats.failed,    icon: XCircle,      color: "text-red-400",    bg: "bg-red-500/10" },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((c, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.05 }}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.bg}`}>
                  <c.icon className={`h-4 w-4 ${c.color}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

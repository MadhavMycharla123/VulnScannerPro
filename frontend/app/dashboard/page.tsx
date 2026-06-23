"use client"

import { useEffect, useState, useCallback } from "react"
import { Navbar } from "@/components/navbar"
import { StatsCards } from "@/components/stats-cards"
import { ScansTable, Scan } from "@/components/scans-table"
import { LayoutDashboard } from "lucide-react"

export default function DashboardPage() {
  const [scans, setScans] = useState<Scan[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadScans = useCallback(async () => {
    try {
      const res = await fetch("/api/history")
      const data = await res.json()
      setScans(data || [])
    } catch (error) {
      console.error("Failed to load scans:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadScans()
    const interval = setInterval(loadScans, 6000)
    return () => clearInterval(interval)
  }, [loadScans])

  const stats = {
    total: scans.length,
    completed: scans.filter((s) => s.status === "done").length,
    queued: scans.filter((s) => s.status === "queued" || s.status === "running").length,
    failed: scans.filter((s) => s.status === "failed").length,
  }

  return (
    <div className="relative min-h-screen">
      {/* Background gradient effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <Navbar />

      <main className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <section className="mb-10">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            <LayoutDashboard className="h-4 w-4" />
            <span>Scan Management</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Monitor and manage all your vulnerability scans in one place
          </p>
        </section>

        {/* Stats */}
        <section className="mb-8">
          <StatsCards stats={stats} />
        </section>

        {/* Scans Table */}
        <section>
          <ScansTable scans={scans} isLoading={isLoading} />
        </section>

        {/* Footer */}
        <footer className="mt-20 border-t border-border/40 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} VulnScanner. Developed by{" "}
            <a
              href="https://www.linkedin.com/in/madhavkumar-mycharla/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              @MadhavMycharla
            </a>
            . Scan responsibly.
          </p>
        </footer>
      </main>
    </div>
  )
}

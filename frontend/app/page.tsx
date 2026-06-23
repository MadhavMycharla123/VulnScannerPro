import { Navbar } from "@/components/navbar"
import { ScanForm } from "@/components/scan-form"
import { Features } from "@/components/features"
import { Shield } from "lucide-react"

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      {/* Background gradient effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <Navbar />

      <main className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            <Shield className="h-4 w-4" />
            <span>Secure Vulnerability Scanning</span>
          </div>
          <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Web Vulnerability
            <span className="block text-primary">Scanner</span>
          </h1>
          <p className="mx-auto max-w-2xl text-balance text-lg text-muted-foreground">
            Scan, detect, and secure web applications in seconds with our advanced
            vulnerability detection engine.
          </p>
        </section>

        {/* Main Content Grid */}
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Scan Form */}
          <div className="lg:order-1">
            <ScanForm />
          </div>

          {/* Features */}
          <div className="lg:order-2">
            <div className="mb-6">
              <h2 className="mb-2 text-xl font-semibold">Powerful Features</h2>
              <p className="text-sm text-muted-foreground">
                Everything you need for comprehensive security testing
              </p>
            </div>
            <Features />
          </div>
        </div>

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

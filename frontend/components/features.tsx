"use client"

import { motion } from "framer-motion"
import { Search, Zap, Shield, Globe, Lock, Activity } from "lucide-react"

const features = [
  {
    icon: Search,
    title: "Deep Scan",
    description: "Comprehensive vulnerability detection across your entire web application",
  },
  {
    icon: Zap,
    title: "Fast Engine",
    description: "Async scanning engine delivers results in seconds, not minutes",
  },
  {
    icon: Shield,
    title: "Security Checks",
    description: "Industry-standard OWASP tests for complete security coverage",
  },
  {
    icon: Globe,
    title: "WHOIS Lookup",
    description: "Domain registration and ownership information at a glance",
  },
  {
    icon: Lock,
    title: "SSL Analysis",
    description: "Certificate validation and encryption strength assessment",
  },
  {
    icon: Activity,
    title: "Port Scanning",
    description: "Nmap integration for comprehensive network port analysis",
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function Features() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {features.map((feature) => (
        <motion.div
          key={feature.title}
          variants={item}
          className="group rounded-xl border border-border/50 bg-card/30 p-5 transition-all hover:border-primary/30 hover:bg-card/60"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
            <feature.icon className="h-5 w-5" />
          </div>
          <h3 className="mb-1 font-semibold">{feature.title}</h3>
          <p className="text-sm text-muted-foreground">{feature.description}</p>
        </motion.div>
      ))}
    </motion.div>
  )
}

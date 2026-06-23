import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VulnScanner - Web Vulnerability Scanner',
  description: 'Scan, detect, and secure web applications with advanced vulnerability scanning',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-background">
        {children}
      </body>
    </html>
  )
}

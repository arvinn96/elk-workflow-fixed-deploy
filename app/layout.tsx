import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'ELK-DESA | Enterprise Workflow Management',
  description: 'Centralized request and approval system for ELK-DESA.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              border: '1px solid #e8e4df',
              color: '#1c1a17',
              fontSize: '13px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
            },
          }}
        />
      </body>
    </html>
  )
}

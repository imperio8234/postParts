import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"
import { LoadingBar } from "@/components/ui/loading-bar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Moto Parts POS",
  description: "Sistema de punto de venta para repuestos de moto",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Suspense fallback={null}>
          <LoadingBar />
        </Suspense>
        {children}
      </body>
    </html>
  )
}

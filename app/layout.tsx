import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "VAKI — მოძებნე სამსახური საქართველოში",
  description:
    "მოძებნე შენი მომდევნო სამსახური საქართველოში. ყველა ვაკანსია ერთ ადგილას — myjobs.ge, hr.ge, jobs.ge და სხვა წყაროებიდან.",
  generator: "Next.js",
  applicationName: "VAKI",
  keywords: ["ვაკანსიები", "სამსახური", "საქართველო", "jobs", "georgia", "careers", "hr", "vaki"],
  authors: [{ name: "VAKI Team" }],
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "ka_GE",
    title: "VAKI — მოძებნე სამსახური საქართველოში",
    description: "ყველა ვაკანსია ერთ ადგილას — myjobs.ge, hr.ge, jobs.ge და სხვა წყაროებიდან.",
    siteName: "VAKI",
  },
  twitter: {
    card: "summary_large_image",
    title: "VAKI — მოძებნე სამსახური საქართველოში",
    description: "ყველა ვაკანსია ერთ ადგილას — myjobs.ge, hr.ge, jobs.ge და სხვა წყაროებიდან.",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0a0e14" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0e14" },
  ],
  colorScheme: "dark",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ka" className="dark">
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

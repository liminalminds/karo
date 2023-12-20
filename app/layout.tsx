import { Poppins } from 'next/font/google';
import type { Metadata } from 'next'
import '@styles/globals.css'

const poppins = Poppins({weight:['400','600','700'], subsets:["latin"]});

export const metadata: Metadata = {
  title: 'JDI: Todo App',
  description: "The only ToDo application you'll ever need",
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className={poppins.className}>{children}</body>
    </html>
  )
}

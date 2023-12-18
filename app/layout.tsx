import type { Metadata } from 'next'
import './styles/globals.css'

export const metadata: Metadata = {
  title: 'JDI: Todo App',
  description: "The only ToDo application you'll ever need",
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className='m-0 p-0 box-border bg-black text-white'>{children}</body>
    </html>
  )
}

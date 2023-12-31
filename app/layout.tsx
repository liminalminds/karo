import { DynaPuff, Poppins, Coming_Soon } from 'next/font/google';
import type { Metadata } from 'next'
import '@styles/globals.css'

const font1= DynaPuff({weight:['400','600','700'], subsets:["latin"]});
const font2 = Poppins({weight:['400'], subsets:["latin"]});
const font3 = Coming_Soon({weight:['400'], subsets:["latin"]});

export const metadata: Metadata = {
  title: 'JDI: Todo App',
  description: "A minimalist ToDo manager",
}

interface RootProps {
	children: React.ReactNode
}

const RootLayout = ({children}: RootProps) => {
  return (
    <html lang="en">
      <body className={font3.className}>{children}</body>
    </html>
  )
}

export default RootLayout

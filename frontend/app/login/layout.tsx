import { Pixelify_Sans } from 'next/font/google';
import type { Metadata } from 'next'
import '../global.css'

const pixelify = Pixelify_Sans({
	weight:['400','700'],
	subsets:["latin"],
	variable:'--font-pixelify'
})

export const metadata: Metadata = {
  title: 'Karo | Login',
  description: "A minimalist ToDo manager",
}

interface RootProps {
	children: React.ReactNode
}

const RootLayout = ({children}: RootProps) => {
  return (
    <html lang="en">
      <body className={`${pixelify.variable}`}>
				{children}
			</body>
    </html>
  )
}

export default RootLayout

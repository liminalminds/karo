import { DynaPuff, Poppins } from 'next/font/google';
import type { Metadata } from 'next'
import '@styles/globals.css'

const dynaPuff= DynaPuff({weight:['400','600','700'], subsets:["latin"], variable:'--font-dyna-puff'});
const poppins = Poppins({weight:['400'], subsets:["latin"], variable:'--font-poppins'});

export const metadata: Metadata = {
  title: 'Karo: Todo App',
  description: "A minimalist ToDo manager",
}

interface RootProps {
	children: React.ReactNode
}

const RootLayout = ({children}: RootProps) => {
  return (
    <html lang="en">
      <body
				className={`${dynaPuff.variable} ${poppins.variable}`}
				style={{
					backgroundImage: "url('/background.jpg')",
					backgroundPosition: "center",
					backgroundSize: "cover",
					backgroundRepeat: "no-repeat",
				}}
			>
				{children}
			</body>
    </html>
  )
}

export default RootLayout

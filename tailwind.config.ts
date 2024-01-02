import type { Config } from 'tailwindcss'

const config: Config = {
	content: [
		'./pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./components/**/*.{js,ts,jsx,tsx,mdx}',
		'./app/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		extend: {
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-conic':
					'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
			},
			fontFamily: {
				"dyna-puff": "var(--font-dyna-puff)",
				"poppins": "var(--font-poppins)",
			},
			keyframes: {
				strike: {
					'0%': { width: '0%'},
					'100%': { width: '100%'},
				},
			},
		},
	},
	plugins: [],
}

export default config

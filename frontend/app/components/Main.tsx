'use client'
import { useEffect } from "react"
import { useStore } from "@store/store"
import { LOCALKEY } from "@utils/constants"

interface MainProps {
	children: React.ReactNode
}

export default function Main({children}: MainProps) {
	const setData = useStore(state => state.setData)

	useEffect(() => {
		if (localStorage != undefined) {
			let store = localStorage.getItem(LOCALKEY)
			if (store != null) {
				const localData = JSON.parse(store)
				setData(localData.state.data)
			}
		}
	})

	return (
		<main>
			{children}
		</main>
	)
}

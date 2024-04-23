"use client"
import { useEffect } from "react"
import { useStore } from "../store"

interface MainProps {
	children: React.ReactNode
}

export default function Main({children}: MainProps) {
	const setData = useStore(state => state.setData)

	useEffect(() => {
		if (localStorage != undefined) {
			let store = localStorage.getItem("KARO")
			if (store != null) {
				console.log("FOUND")
				const localData = JSON.parse(store)
				setData(localData.state.data)
			}
		}
	}, [])

	return (
		<main>
			{children}
		</main>
	)
}

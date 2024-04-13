"use client"
import { useEffect } from "react"
import { useDataStore } from "@store"

interface MainProps {
	children:React.ReactNode
}

const Main: React.FC<MainProps> = ({children}) => {
	const setTopics = useDataStore(state => state.setTopics)
	const setSelected = useDataStore(state => state.setSelected)
	useEffect(() => {
		if (localStorage != undefined) {
			const data = localStorage.getItem("karo")
			if (data != null) {
				const { state } = JSON.parse(data)
				setTopics(state.topics, true)
				setSelected(state.selected)
			}
		}
	})
	return (
		<main className="flex w-screen top-1 text-l h-screen bg-[rgba(0,0,0,0.7)]">
			{children}
		</main>
	)
}

export default Main

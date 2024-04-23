"use client"
import { useEffect } from "react"
import { useStore } from "../store"
import { genId } from "../utils"
import { ITask } from "../interface"

interface MainProps {
	children: React.ReactNode
}

export default function Main({children}: MainProps) {
	const setData = useStore(state => state.setData)

	// Code to convery old item to new item
	function transform(tasks: Array<any>) {
		const newTasks: Array<ITask> = tasks.map((task) => {
			return {
				id: genId('tsk_'),
				text: task.text,
				completed: task.completed,
			}
		})
		return newTasks
	}



	useEffect(() => {
		if (localStorage != undefined) {
			const old = localStorage.getItem("karo")
			let store = localStorage.getItem("KARO")
			let newData;
			if (old && !store) {
				newData = {
					quests: [{
						"id": genId('qst_'),
						"name": "TODAY",
						"tasks": transform(JSON.parse(old))
					}],
					selected: null,
					options: {
						addNewOnTop: false,
						moveCompletedToBottom: false,
					}
				}
			}
			// Add logic to add new Data created above
			console.log('use effect')
			if (store != null) {
				const data = JSON.parse(store)
				setData(data,false)
			}
		}
	}, [])

	return (
		<main>
			{children}
		</main>
	)
}

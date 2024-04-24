'use client'
import { useEffect } from "react"
import { useStore } from "@store/store"
import idgen from "@utils/idgen"
import IStore from "@interfaces/store"
import ITask from "@interfaces/task"
import { LOCALKEY, LOCALKEY_OLD } from "@utils/constants"

interface MainProps {
	children: React.ReactNode
}

export default function Main({children}: MainProps) {
	const setData = useStore(state => state.setData)

	useEffect(() => {
		if (localStorage != undefined) {
			const oldStore = localStorage.getItem(LOCALKEY_OLD)
			const oldData: Array<ITask> = oldStore ? JSON.parse(oldStore) : []
			if (oldData.length > 0) {
				const tasks: Array<ITask> = oldData.map(task => ({
					completed: task.completed,
					id: idgen("tsk_"),
					text: task.text,
				}))
				const data: IStore = {
					quests: [{id: "0", name: "MISC", tasks: tasks}],
					selected: "0",
					options: {
						addNewOnTop: false,
						moveCompletedToBottom: false
					}
				}
				setData(data)
				localStorage.removeItem(LOCALKEY_OLD)
			} else {
				let store = localStorage.getItem(LOCALKEY)
				if (store != null) {
					const localData = JSON.parse(store)
					setData({...localData.state.data})
				}
			}
		}
	})

	return (
		<main>
			{children}
		</main>
	)
}

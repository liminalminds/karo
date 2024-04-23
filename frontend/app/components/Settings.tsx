"use client"
import { useState } from "react"
import { IStore, ITask } from "../interface"
import styles from "./Settings.module.css"
import { useStore } from "../store"

export default function Settings() {
	const [data, setData] = useStore(state => [state.data, state.setData])
	let questIndex = -1
	if (data.selected != null) {
		questIndex = data.quests.findIndex(quest => quest.id === data.selected)
	}
	if (questIndex == -1) {
		const tasks: Array<ITask>  = []
	}
	else {
		data.quests[questIndex].tasks
	}
	const [topTask, setTopTask] = useState<boolean>(false)//data.options.addNewOnTop);
	const [completeBottom, setCompleteBottom] = useState<boolean>(false)//data.options.moveCompletedToBottom);

	const toggleTopTask = () => {
		setTopTask((check) => !check)
	}

	const toggleCompleteBottom = () => {
		setCompleteBottom((check) => !check)
	}

	function clearCompleted() {
		const newTasks = tasks.filter(task => !task.completed)
		setData(data)
		localStorage.setItem("KARO", JSON.stringify(newTasks))
	}

	return (
		<section className={styles.options}>
			<div>
				<input onChange={toggleTopTask} type="checkbox"/>
				<div className={styles.text}>Add Tasks on Top</div>
			</div>
			<div>
				<input onChange={toggleCompleteBottom} type="checkbox"/>
				<div className={styles.text}>Move Completed Items To The Bottom</div>
			</div>
			<div>
				<button onClick={clearCompleted} className={styles.button}>Clear</button>
			</div>
		</section>
	)
}

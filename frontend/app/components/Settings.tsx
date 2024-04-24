"use client"
import { useStore } from "@store/store"
import IStore from "@interfaces/store"
import styles from "@styles/Settings.module.css"

export default function Settings() {
	const [data, setData]:[IStore, (data:IStore) => void] = useStore(state => [state.data, state.setData])
	const questIndex = data.quests.findIndex(quest => quest.id === data.selected)
	const tasks = data.quests[questIndex].tasks

	async function toggleTopTask() {
		data.options.addNewOnTop = !data.options.addNewOnTop
		setData({...data})
	}

	async function toggleCompleteBottom() {
		data.options.moveCompletedToBottom = !data.options.moveCompletedToBottom
		setData({...data})
	}

	async function clearCompleted() {
		data.quests[questIndex].tasks = tasks.filter(task => !task.completed)
		setData({...data})
	}

	return (
		<section className={styles.options}>
			<div>
				<input onChange={toggleTopTask} type="checkbox" checked={data.options.addNewOnTop}/>
				<div className={styles.text}>Add Tasks on Top</div>
			</div>
			<div>
				<input onChange={toggleCompleteBottom} type="checkbox" checked={data.options.moveCompletedToBottom}/>
				<div className={styles.text}>Move Completed Items To The Bottom</div>
			</div>
			<div>
				<button onClick={clearCompleted} className={styles.button}>Clear</button>
			</div>
		</section>
	)
}

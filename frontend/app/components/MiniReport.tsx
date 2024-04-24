"use client"
import  { useStore } from "@store/store"
import IStore from "@interfaces/store"
import styles from "@styles/MiniReport.module.css"

export default function MiniReport() {
	const data: IStore = useStore((state) => state.data)
	let total
	let complete
	if (data.selected == null) {
		total = 0
		complete = 0
	}
	else {
		const questIndex = data.quests.findIndex((quest) => quest.id === data.selected)
		const tasks = data.quests[questIndex].tasks
		total = tasks.length
		complete = tasks.filter(task => task.completed).length
	}
	return (
		<section className={styles.section}>
			<div className={styles.total}>
				<div>Total Tasks</div>
				<div className={styles.value}>{total}</div>
			</div>
			<div className={styles.complete}>
				<div>Completed</div>
				<div className={styles.value}>{complete} of {total}</div>
			</div>
		</section>
	)
}

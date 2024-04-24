"use client"
import { useRef } from "react"
import { useStore } from "@store/store"
import Task from "@components/Task"
import ITask from "@interfaces/task"
import IQuest from "@interfaces/quest"
import styles from "@styles/Task.module.css"

export default function TaskList() {
	const [data, setData] = useStore((state) => [state.data, state.setData])
	const questIndex: number = data.quests.findIndex((quest:IQuest) => quest.id === data.selected)
	const tasks: Array<ITask> = data.quests[questIndex].tasks
	const draggedItem = useRef<number>(-1)
	const draggedOverItem = useRef<number>(-1)

	async function rearrange() {
		const [shift] = tasks.splice(draggedItem.current, 1)
		tasks.splice(draggedOverItem.current, 0, shift)
		data.quests[questIndex].tasks = tasks
		setData(data)
	}

	return (
		<section className={styles.tasks}>
			<ul>
			{
				tasks.map((task) => {
					return (
						<li
							draggable
							key={task.id}
							onDragStart={() => (draggedItem.current = tasks.indexOf(task))}
							onDragEnter={() => (draggedOverItem.current = tasks.indexOf(task))}
							onDragEnd={rearrange}
							onDragOver={e => e.preventDefault()}
						>
							<Task
								id={task.id}
								completed={task.completed}
								text={task.text}
							/>
						</li>
					)
				})
			}
			</ul>
		</section>
	)
}

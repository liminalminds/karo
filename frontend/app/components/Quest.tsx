"use client"
import { useRef } from 'react'
import Task from "./Task"
import { IStore, ITask } from "../interface"
import { useStore } from "../store"

export default function Quest() {
	const tasks: Array<ITask> = []

	// const [tasks, setTasks] = useState<Array<ITask>>([])
	const draggedItem = useRef<string>('');
	const draggedOverItem = useRef<string>('');

	function rearrange() {
		// const [shift] = tasks.splice(draggedItem.current, 1)
		// tasks.splice(draggedOverItem.current, 0, shift)
		// setTasks(() => [...tasks])
		localStorage.setItem("KARO", JSON.stringify(tasks))
	}

	return (
		<section className="tasks">
			<ul>
			{
				tasks.map((task) => {
					return (
						<li
							draggable
							key={task.id}
							className="task"
							onDragStart={() => (draggedItem.current = task.id)}
							onDragEnter={() => (draggedOverItem.current = task.id)}
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

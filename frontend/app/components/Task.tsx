"use client"
import {useState} from 'react'
import { RiDeleteBinLine } from "react-icons/ri";
import { RiPencilFill } from "react-icons/ri";
import {ITask} from '../interface'
import { FaCheck } from "react-icons/fa";
import styles from "./Task.module.css"


export default function Task(task: ITask) {
	const [tasks, setTasks] = useState<Array<ITask>>([])
	const [complete, setComplete] = useState<number>(0)
	const [completeBottom, setCompleteBottom] = useState<boolean>(false);
	const [total, setTotal] = useState<number>(0)

	function toggleComplete(taskId: string, status: boolean) {
		// tasks[taskId].completed = !status
		// setComplete(complete => status?complete-1:complete+1)
		// if (!status && completeBottom) {
		// 	const [ completedTask ] = tasks.splice(taskId,1)
		// 	tasks.push(completedTask)
		// }
		// setTasks(() => [...tasks])
		// localStorage.setItem("karo", JSON.stringify(tasks))
	}

	function editTask(taskId: string) {
		// setEditModal(visible => !visible)
		// const newTasks = tasks.filter((_,index) => taskId != index)
		// setTasks(() => newTasks)
		// localStorage.setItem("karo", JSON.stringify(newTasks))
	}

	function deleteTask(taskId: string, status: boolean) {
		// const newTasks = tasks.filter((_,index) => taskId != index)
		// setTasks(() => newTasks)
		// setComplete((complete) => status?complete-1:complete)
		// setTotal((total) => total-1);
		// localStorage.setItem("karo", JSON.stringify(newTasks))
	}

	return (
		<div className={styles.task}>
			<div
				onClick={() => toggleComplete(task.id, task.completed)}
				className={`${styles.status}`+`${task.completed?styles.complete:''}`}
			>
			{
				task.completed ? <FaCheck /> : ''
			}
			</div>
			<div className={`${styles.text}`+`${task.completed?styles.done:''}`}>{task.text}</div>
			<div className={styles.taskpts}>
				<div
					onClick={() => editTask(task.id)}
					className={styles.edit}
				>
					<RiPencilFill />
				</div>
				<div
					onClick={() => deleteTask(task.id, task.completed)}
					className={styles.delete}
				>
					<RiDeleteBinLine />
				</div>
			</div>
		</div>
	)
}

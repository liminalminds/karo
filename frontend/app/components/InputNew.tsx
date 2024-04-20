"use client"
import { useState, useRef } from "react"
import { ITask } from "../interface"
import { LuPlusCircle } from "react-icons/lu"
import { genId } from "../utils"
import styles from './InputNew.module.css'


export default function InputNew() {

	// const [topTask, setTopTask] = useState<boolean>(false) // comes from localhost OR API
	// const [tasks, setTasks] = useState<Array<ITask>>([])
	// const [total, setTotal] = useState<number>(0)
	// const [filterSearch, setFilterSearch] = useState<boolean>(false)

	const ref = useRef<HTMLInputElement>(null)

	function addTask() {
	// 	if (!ref.current || ref.current.value == "") return
	// 	const taskId = genId("task_")
	// 	const newTask: ITask = {
	// 		id: taskId,
	// 		completed: false,
	// 		text: ref.current.value
	// 	}
	// 	topTask ? tasks.unshift(newTask) : tasks.push(newTask)
	// 	setTasks(() => [...tasks])
	// 	setTotal(() => tasks.length)
	// 	ref.current.value = ""
	// 	localStorage.setItem("karo", JSON.stringify(tasks))
	}

	// function search() {
	// 	if (!filterSearch) return
	// 	if (!ref.current || ref.current.value == "") return
	// 	const query = ref.current?.value.toLowerCase()
	// 	setTasks(() => [...tasks.filter(task => task.text.toLowerCase().includes(query))])
	// }
	function onEnter(e: any) {
		// e.key === "Enter" ? addTask() : search()
	}

	return (
		<section className={styles.section}>
			<input
				ref={ref}
				id="newtask"
				className={styles.input}
				type="text"
				placeholder="Add a new task"
				onKeyDown={(e) => onEnter(e)}
				spellCheck="false"
				autoComplete="off"
			/>
			<button onClick={addTask} className={styles.button}>
				<div className={styles.text}>Add</div>
				<div className={styles.icon}><LuPlusCircle /></div>
			</button>
		</section>
	)
}

"use client"
import { useRef } from "react"
import { genId } from "../utils"
import { useStore } from "../store"
import { ITask, IQuest } from "../interface"
import { LuPlusCircle } from "react-icons/lu"
import styles from "./InputNew.module.css"


export default function InputNew() {
	const [data, setData] = useStore((state) => [state.data, state.setData])
	const addNewOnTop = false // move this inside a new component so that InputNew is a server side component
	const ref = useRef<HTMLInputElement>(null)

	function addTask() {
		if (!ref.current || ref.current.value == "") return
		const newTask: ITask = {
			id: genId("task_"),
			completed: false,
			text: ref.current.value
		}
		const questIndex = data["quests"].findIndex((quest:IQuest) => quest.id === data.selected)
		if (addNewOnTop) {
			data["quests"][questIndex].tasks.unshift(newTask)
		} else {
			data["quests"][questIndex].tasks.push(newTask)
		}
		ref.current.value = ""
		setData(data)
	}

	function onEnter(e: any) {
		if (data.selected == null) return
		if (e.key === "Enter") addTask()
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

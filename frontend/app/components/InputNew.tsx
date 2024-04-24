"use client"
import { useRef } from "react"
import { LuPlusCircle } from "react-icons/lu"
import { KeyboardEvent } from 'react'
import idgen from "@utils/idgen"
import { useStore } from "@store/store"
import ITask from "@interfaces/task"
import IQuest from "@interfaces/quest"
import styles from "@styles/InputNew.module.css"

export default function InputNew() {
	const [data, setData] = useStore((state) => [state.data, state.setData])
	const ref = useRef<HTMLInputElement>(null)

	function addTask() {
		if (!ref.current || ref.current.value == "") return
		const newTask: ITask = {
			id: idgen("task_"),
			completed: false,
			text: ref.current.value
		}
		const questIndex = data.quests.findIndex((quest:IQuest) => quest.id === data.selected)
		if (data.options.addNewOnTop) {
			data.quests[questIndex].tasks.unshift(newTask)
		} else {
			data.quests[questIndex].tasks.push(newTask)
		}
		ref.current.value = ""
		setData({...data})
	}

	function onEnter(e: KeyboardEvent) {
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

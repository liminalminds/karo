"use client"
import { useState, useRef, useEffect } from 'react'
import { FaCheck } from "react-icons/fa";
import { RiDeleteBinLine } from "react-icons/ri";
import { LuPlusCircle } from "react-icons/lu";

interface Task {
	completed: boolean;
	text: string;
}

export default function Home() {

	const [tasks, setTasks] = useState<Array<Task>>([])
	const [total, setTotal] = useState<number>(0)
	const [complete, setComplete] = useState<number>(0)

	/* Settings */
	const [topTask, setTopTask] = useState<boolean>(false);
	const [completeBottom, setCompleteBottom] = useState<boolean>(false);


	const ref = useRef<HTMLInputElement>(null)
	const draggedItem = useRef<number>(0);
	const draggedOverItem = useRef<number>(0);

	useEffect(() => {
		if (localStorage != undefined) {
			const data = localStorage.getItem("karo")
			if (data != null) {
				const tasks = JSON.parse(data)
				setTasks(tasks)
				setTotal(tasks.length)
				setComplete(tasks.filter((task: Task) => task.completed).length)
			}
		}
	}, [])

	function toggleTopTask() {
		setTopTask((check) => !check)
	}

	function toggleCompleteBottom() {
		setCompleteBottom((check) => !check)
	}

	function toggleComplete(taskId: number, status: boolean) {
		tasks[taskId].completed = !status
		setComplete(complete => status?complete-1:complete+1)
		if (!status && completeBottom) {
			const [ completedTask ] = tasks.splice(taskId,1)
			tasks.push(completedTask)
		}
		setTasks(() => [...tasks])
		localStorage.setItem("karo", JSON.stringify(tasks))
	}

	function deleteTask(taskId: number, status: boolean) {
		const newTasks = tasks.filter((_,index) => taskId != index)
		setTasks(() => newTasks)
		setComplete((complete) => status?complete-1:complete)
		setTotal((total) => total-1);
		localStorage.setItem("karo", JSON.stringify(newTasks))
	}

	function addTask() {
		if (!ref.current || ref.current.value == '') return
		const newTask: Task = {completed: false, text: ref.current.value}
		topTask ? tasks.unshift(newTask) : tasks.push(newTask);
		setTasks(() => [...tasks])
		setTotal((total) => total+1);
		ref.current.value = ''
		localStorage.setItem("karo", JSON.stringify(tasks))
	}

	function onEnter(e: any) {
		if (e.key === 'Enter') {addTask()}
	}

	function rearrange() {
		const [shift] = tasks.splice(draggedItem.current,1)
		tasks.splice(draggedOverItem.current, 0, shift)
		setTasks(() => [...tasks])
		localStorage.setItem("karo", JSON.stringify(tasks))
	}

	function clearCompleted() {
		const newTasks = tasks.filter(task => !task.completed)
		setTasks(newTasks)
		localStorage.setItem("karo", JSON.stringify(newTasks))
	}

	return (
		<>
			<header>
				<div className='title'>
					<div className='first'>ka</div><div className='second'>ro</div>
				</div>
			</header>
			<main>
				<section className='new' >
					<input
						ref={ref}
						id='newtask'
						type='text'
						placeholder='Add a new task'
						onKeyDown={(e) => onEnter(e)}
					/>
					<button onClick={addTask} className='addbtn'>
						<div className='text'>Add</div>
						<div className='icon'><LuPlusCircle /></div>
					</button>
				</section>
				<section className='minireport'>
					<div className='total'>
						<div className='key'>Total Tasks</div>
						<div className='value'>{total}</div>
					</div>
					<div className='done'>
						<div className='key'>Completed</div>
						<div className='value'>{complete} of {total}</div>
					</div>
				</section>
				<section className='options'>
					<div className='option'>
						<input onChange={toggleTopTask} type='checkbox'/>
						<div className='text'>Add Tasks on Top</div>
					</div>
					<div className='option'>
						<input onChange={toggleCompleteBottom} type='checkbox'/>
						<div className='text'>Move Completed Items To The Bottom</div>
					</div>
					<div className='option'>
						<button onClick={clearCompleted}>Clear</button>
					</div>
				</section>
				<section className='tasks'>
					<ul>
					{
						tasks.map((task,key) => {
							return (
								<li
									key={key}
									className='task'
									draggable
									onDragStart={() => (draggedItem.current = key)}
									onDragEnter={() => (draggedOverItem.current = key)}
									onDragEnd={rearrange}
									onDragOver={e => e.preventDefault()}
								>
									<div
										onClick={() => toggleComplete(key, task.completed)}
										className={'status' + (task.completed?' complete':'')}
									>
									{
										task.completed
										?<FaCheck />
										:''
									}
									</div>
									<div className={'text' + (task.completed?' done':'incomplete')}>{task.text}</div>
									<div className='taskopts'>
										<div
											onClick={() => deleteTask(key, task.completed)}
											className='delete'
										>
											<RiDeleteBinLine />
										</div>
									</div>
								</li>
							)
						})
					}
					</ul>
				</section>
			</main>
		</>
	)
}

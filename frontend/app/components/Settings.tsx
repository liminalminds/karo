import { ITask } from '../interface'
import styles from './Settings.module.css'

export default function Settings() {
	//  const [tasks, setTasks] = useState<Array<ITask>>([])
	//  const [topTask, setTopTask] = useState<boolean>(false);
	//  const [completeBottom, setCompleteBottom] = useState<boolean>(false);

	function toggleTopTask() {
	//  	setTopTask((check) => !check)
	}

	function toggleCompleteBottom() {
	//  	setCompleteBottom((check) => !check)
	}

	function clearCompleted() {
	//  	const newTasks = tasks.filter(task => !task.completed)
	//  	setTasks(newTasks)
	//  	localStorage.setItem("karo", JSON.stringify(newTasks))
	}

	/* Make a custom checkbox and replace the bwloe input:checkbox */

	return (
		<section className={styles.options}>
			<div>
				<input type='checkbox'/>
				<div className={styles.text}>Add Tasks on Top</div>
			</div>
			<div>
				<input type='checkbox'/>
				<div className={styles.text}>Move Completed Items To The Bottom</div>
			</div>
			{/*
			<div>
				<input onChange={toggleFilterSearch} type='checkbox'/>
				<div className='text'>Display Items By Content While Typing</div>
			</div>
			*/}
			<div>
				<button className={styles.button}>Clear</button>
			</div>
		</section>
	)
}

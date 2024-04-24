import { RiDeleteBinLine } from "react-icons/ri";
import { RiPencilFill } from "react-icons/ri";
import IQuest from "@interfaces/quest"
import ITask from "@interfaces/task"
import { FaCheck } from "react-icons/fa";
import { useStore } from "@store/store"
import styles from "@styles/Task.module.css"

export default function Task({completed, id, text}: ITask) {
	const [data, setData] = useStore((state) => [state.data, state.setData])
	const questIndex = data.quests.findIndex((quest:IQuest) => quest.id === data.selected)
	const tasks: Array<ITask> = data.quests[questIndex].tasks

	function deleteTask(taskId: string) {
		data.quests[questIndex].tasks = tasks.filter(task => task.id != taskId)
		setData({...data})
	}

	function toggleComplete(taskId: string, status: boolean) {
		const taskIndex = tasks.findIndex(task => task.id === taskId)
		tasks[taskIndex].completed = !status
		if (!status && data.options.moveCompletedToBottom) {
			const [ completedTask ] = tasks.splice(taskIndex,1)
			tasks.push(completedTask)
		}
		data.quests[questIndex].tasks = tasks
		setData({...data})
	}

	return (
		<div className={styles.task}>
			<div
				onClick={() => toggleComplete(id, completed)}
				className={`${styles.status} `+`${completed?styles.completed:""}`}
			>
			{
				completed ? <FaCheck /> : ""
			}
			</div>
			<div className={`${styles.text} `+`${completed?styles.done:""}`}>{text}</div>
			<div className={styles.taskopts}>
				<div
					className={styles.edit}
				>
					<RiPencilFill />
				</div>
				<div
					onClick={() => deleteTask(id)}
					className={styles.delete}
				>
					<RiDeleteBinLine />
				</div>
			</div>
		</div>
	)
}

import Header from './components/Header'
import InputNew from './components/InputNew'
import MiniReport from './components/MiniReport'
import Quest from './components/Quest'
import Settings from './components/Settings'

export default function Home() {

	// const [tasks, setTasks] = useState<Array<ITask>>([])
	// const [total, setTotal] = useState<number>(0)
	// const [complete, setComplete] = useState<number>(0)

	// const [completeBottom, setCompleteBottom] = useState<boolean>(false);
	// const [filterSearch, setFilterSearch] = useState<boolean>(false);

	// useEffect(() => {
	// 	if (localStorage != undefined) {
	// 		const data = localStorage.getItem("karo")
	// 		if (data != null) {
	// 			const tasks = JSON.parse(data)
	// 			setTasks(tasks)
	// 			setTotal(tasks.length)
	// 			setComplete(tasks.filter((task: ITask) => task.completed).length)
	// 		}
	// 	}
	// }, [])

	// function toggleFilterSearch() {
	// 	setFilterSearch((check) => !check)
	// }

	// function toggleComplete(taskId: number, status: boolean) {
	// 	tasks[taskId].completed = !status
	// 	setComplete(complete => status?complete-1:complete+1)
	// 	if (!status && completeBottom) {
	// 		const [ completedTask ] = tasks.splice(taskId,1)
	// 		tasks.push(completedTask)
	// 	}
	// 	setTasks(() => [...tasks])
	// 	localStorage.setItem("karo", JSON.stringify(tasks))
	//	<main>
	//		<InputNew />
	//		<MiniReport />
	//		<Settings />
	//		<TaskList />
	//	</main>
	// }

	return (
		<>
			<Header />
			<main>
				<InputNew />
				<Settings />
				<MiniReport total={144} complete={67}/>
				<Quest />
			</main>
		</>
	)
}

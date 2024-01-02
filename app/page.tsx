import "react-toastify/ReactToastify.css"
import { ToastContainer } from "@components/toast"
import TopicBar from "@components/topics/TopicBar"
import ActionBar from "@components/actions/ActionBar"
import GoalList from "@components/goals/GoalList"

const App: React.FC = () => {
	console.log('App')
	return (
		<main className='flex w-screen h-screen'>
				<ToastContainer />
				<TopicBar />
				<ActionBar />
				<GoalList />
		</main>
	)
}

export default App;

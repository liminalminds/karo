import "react-toastify/ReactToastify.css"
import { ToastContainer } from "@components/toast"
import TopicBar from "@components/topics/TopicBar"
import ActionBar from "@components/actions/ActionBar"
import GoalList from "@components/goals/GoalList"
import Main from "@components/Main"

const App: React.FC = () => {
	return (
		<Main className='top-1 text-l'>
			<ToastContainer />
			<TopicBar />
			<ActionBar />
			<GoalList />
		</Main>
	)
}

export default App;

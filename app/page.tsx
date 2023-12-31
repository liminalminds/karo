import "react-toastify/ReactToastify.css"
import { ToastContainer } from "@components/Toast"
import TopicBar from "@components/TopicBar"
import ActionBar from "@components/ActionBar"
import GoalBar from "@components/GoalBar"
import Menu from "@components/Menu"
import { InputAction, InputTopic } from "@components/Input"

const App: React.FC = () => {
	return (
		<main className='flex w-screen h-screen'>
			<ToastContainer />
			<nav id='topics' className='relative w-1/4 text-center overflow-y-scroll bg-yellow-100 fg-[color:var(--fg-nav)]'>
				<header>
					<h1 id='logo' className='my-4 font-semibold text-6xl'>
						J D I
					</h1>
					<div className='p-3 m-3 relative shadow-[4px_6px_1px] border-2 border-black rounded-[30px] bg-white'>
						<InputTopic />
					</div>
				</header>
				<TopicBar />
			</nav>
			<section id='actions' className='w-1/2 bg-[color:var(--bg-theme)] overflow-y-scroll'>
				<div className='my-[1.75rem] mx-auto'>
					<Menu />
				</div>
				<div className='p-3 mx-4 relative bg-[color:var(--bg-nav)] shadow-[4px_6px_1px] border-2 border-black rounded-[30px]'>
					<InputAction />
				</div>
				<ActionBar />
			</section>
			<aside id='report' className='w-1/4 h-screen bg-green-100 overflow-y-scroll'>
				<GoalBar />
			</aside>
		</main>
	)
}

export default App;

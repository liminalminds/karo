import Header from './components/Header'
import InputNew from './components/InputNew'
import MiniReport from './components/MiniReport'
import Quest from './components/Quest'
import Settings from './components/Settings'
import Main from './components/Main'
import { ToastContainer } from './components/Toast'

export default function Home() {
	return (
		<>
			<Header />
			<Main>
				<ToastContainer />
				<InputNew />
				<Settings />
				<MiniReport />
				<Quest />
			</Main>
		</>
	)
}

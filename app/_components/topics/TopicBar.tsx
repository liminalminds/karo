import { InputTopic } from "@components/input/InputTopic"
import TopicList from "@components/topics/TopicList"
import Header from "@components/Header"

const TopicBar = () => {
	return (
		<aside className='relative w-1/4 text-center overflow-y-scroll bg-transparent text-white'>
			<Header />
			<div className='relative p-3 m-3 shadow-[4px_6px_1px] border-2 border-white rounded-[30px] text-white'>
				<InputTopic />
			</div>
			<TopicList />
		</aside>
	)
}

export default TopicBar

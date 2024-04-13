"use client"
import Topic from "@components/topics/Topic"
import { useDataStore } from "@store"

const TopicList: React.FC = () => {
	const topics = useDataStore((state) => state.topics)
	const selected = useDataStore((state) => state.selected)
	return (
		<div className='relative font-dyna-puff text-center overflow-y-scroll bg-transparent text-white'>
			<ul className='mx-3'>
				{topics.map(topic => {
					return (
						<li
							draggable
							key={topic.id}
							className='my-4'
						>
							<Topic
								id={topic.id}
								title={topic.title}
								goal={topic.goal}
								selected={selected === topic.id}
							/>
						</li>
					)
				})}
			</ul>
		</div>
	)
}

export default TopicList

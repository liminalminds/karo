"use client"
import Topic from "@components/Topic"
import { useDataStore } from "@state/store"

const TopicBar: React.FC = () => {
	const topics = useDataStore((state) => state.data)
	const selected = useDataStore(state => state.selected)
	localStorage.setItem('JDI',JSON.stringify({data:topics,selected:selected}))
	const selectTopic = useDataStore((state) => state.setSelected)
	const onClick = (topicId: string) => selectTopic(topicId)
	return (
		<nav className='relative text-center overflow-y-scroll bg-yellow-100 fg-[color:var(--fg-nav)]'>
			<ul className='mx-3'>
				{topics.map(topic => {
					return (
						<li
							draggable
							key={topic.id}
							onClick={() => onClick(topic.id)}
							className='my-4'
						>
							<Topic
								id={topic.id}
								title={topic.title}
								goal={topic.goal}
							/>
						</li>
					)
				})}
			</ul>
		</nav>
	)
}

export default TopicBar;

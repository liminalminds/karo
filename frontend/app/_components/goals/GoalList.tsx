"use client"
import { useDataStore } from "@store"
import Goal from "@components/goals/Goal"

const GoalList: React.FC = () => {
	const topics = useDataStore(state => state.topics).filter(topic => topic.goal)
	return (
		<aside className='w-1/4 h-screen bg-transparent text-white overflow-y-scroll'>
			<ul className='m-4'>
				{topics.map((topic) => {
						return (
							<li
								key={topic.id}
								className='my-6'
							>
								<Goal
									id={topic.id}
									title={topic.title}
									count={topic.actions.filter(action => action.completed).length}
									total={topic.actions.length}
								/>
							</li>
						)
				})}
			</ul>
		</aside>
	)
}

export default GoalList

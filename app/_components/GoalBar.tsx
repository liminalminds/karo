import { useDataStore } from "@state/store"
import Goal from "@components/Goal"

const GoalBar: React.FC = () => {
	const data = useDataStore((state) => state.data)
	return (
		<ul className='m-4'>
			{data.map((topic) => {
					if (topic.goal) {
						return (
							<li
								key={topic.id}
								className='my-6'
							>
								<Goal
								  id={topic.id}
									title={topic.title}
									count={topic.actions.filter(a => a.completed === true).length}
									total={topic.actions.length}
									color='green'
								/>
							</li>
						)
					}
			})}
		</ul>
	)
}

export default GoalBar

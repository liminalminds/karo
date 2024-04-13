"use client"
import { useDataStore } from "@store"
import Action from "@components/actions/Action"
import { IAction, ITopic } from "@types"

const ActionList: React.FC = (): JSX.Element => {
	const selected = useDataStore(state => state.selected)
	const topics = useDataStore(state => state.topics)
	let filterTopics: Array<ITopic> = topics.filter(topic => topic.id === selected)
	const actions = filterTopics.length === 0 ? [] : filterTopics[0].actions
	return (
		<ul className='mx-4 my-4'>
			{actions.map((action:IAction) => {
					return (
						<li
							key={action.id}
							className='my-6'
						>
							<Action
								id={action.id}
								title={action.title}
								completed={action.completed}
							/>
						</li>
					)
			})}
		</ul>
	)
}

export default ActionList

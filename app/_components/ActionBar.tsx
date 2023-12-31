"use client"
import Action from "@components/Action"
import { useDataStore } from "@state/store"
import { IAction } from "@types"

const ActionBar: React.FC = () => {
	const data = useDataStore((state) => state.data)
	const selected = useDataStore((state) => state.selected)

	return (
		<ul className='mx-4 my-4'>
			{data.filter((topic) => topic.id === selected)[0]?.actions.map((action:IAction) => {
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

export default ActionBar

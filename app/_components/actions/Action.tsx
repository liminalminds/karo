"use client"
import { useRef, useState } from "react"
import { RiDeleteBin6Fill } from "react-icons/ri"
import { FaPencil } from "react-icons/fa6"
import { SiConvertio } from "react-icons/si"
import { generateId } from "@utils"
import Edit from "@components/modals/Edit"
import { useDataStore } from "@store"

interface ActionProps {
	id: string;
	title: string;
	completed: boolean;
}

const Action: React.FC<ActionProps> = ({
	id,
	title,
	completed,
}: ActionProps) => {
	const [modal, toggle] = useState<boolean>(false)
	const ref = useRef<HTMLInputElement>(null)
	const toggleCompleted = useDataStore(state => state.toggleCompleted)
	const createTopic = useDataStore(state => state.createTopic)
	const deleteAction = useDataStore(state => state.deleteAction)
	const updateAction = useDataStore(state => state.updateAction)
	const onConvert = async () => {
		if (confirm('Are you sure you want to convert this action into a topic / goal?')) {
			createTopic({id: await generateId('tpc'), title:title, goal: true, actions: []})
			deleteAction(id)
		}
	}
	const callback = ():void => {
		const newTitle = ref.current?.value
		if (newTitle === '' || newTitle === null || newTitle === undefined) return
		updateAction(id, newTitle)
		toggle(false)
	}
	return (
		<div className='py-3 px-4 flex text-center justify-between overflow-hidden items-center text-2xl border-2 border-white rounded-[30px] bg-black'>
			<div className='flex items-center gap-3'>
				<input className='h-5 w-5 cursor-pointer accent-fuchsia-600 duration-500' type='checkbox' defaultChecked={completed} onChange={(e) => toggleCompleted(id, e.target.checked)}/>
				<div className={completed?'text-left text-gray-800 bg-black line-through animate-strike duration-500':'text-white bg-black duration-500'}>
					{modal
					? <Edit
						placeholder='new name'
						defaultValue={title}
						autoFocus={true}
						callback={callback}
					/> : title}
				</div>
			</div>
			<div className='flex gap-3'>
				<FaPencil className='cursor-pointer' style={{color: modal?'orange':'yellow'}} onClick={() => toggle((prev) => prev?false:true)}/>
				<SiConvertio className='float-right bg-black text-blue-500' onClick={onConvert} />
				<RiDeleteBin6Fill className='float-right bg-black text-red-500' onClick={() => deleteAction(id)} />
			</div>
		</div>
	)
}

export default Action

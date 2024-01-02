"use client"
import { FaPencil } from "react-icons/fa6"
import { RiDeleteBin6Fill } from "react-icons/ri"
import { LuTarget } from "react-icons/lu";
import { GiAbstract050 } from "react-icons/gi";
import { KeyboardEvent, useRef, useState } from "react";
import { useDataStore } from "@store";

interface TopicProps {
	id: string;
	goal: boolean
	title: string;
	selected: boolean;
}

const Topic: React.FC<TopicProps> = ({
	id,
	goal,
	title,
	selected,
}: TopicProps): JSX.Element => {
	const selectTopic = useDataStore(state => state.setSelected)
	const deleteTopic = useDataStore((state) => state.deleteTopic)
	const updateTopic = useDataStore((state) => state.updateTopic)
	const toggleGoal = useDataStore((state) => state.toggleGoal)

	const [modal, toggle] = useState<boolean>(false)
	const ref = useRef<HTMLInputElement>(null)

	const onDelete = () => {if (confirm('Are you sure you want to delete this topic?')) deleteTopic(id)}
	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key !== 'Enter') return
		const newTitle = ref.current?.value
		if (newTitle === '' || newTitle === null || newTitle === undefined) return
		updateTopic(id, newTitle)
		toggle(false)
	}

	return (
		<div
			className={'text-white items-center cusror-pointer flex flex-wrap overflow-hidden border-white border-2 rounded-[30px] relative text-2xl p-3 justify-between '.concat(selected?'bg-gray-900':'bg-black')}
			onClick={() => selectTopic(id)}
		>
			<span className='flex items-center gap-2'>
				<div>
					<GiAbstract050 />
				</div>
				<div
					spellCheck='false'
					className='text-ellipsis outline-none uppercase text-white'
				>
					{modal
					? <input
						ref={ref}
						type='text'
						size={15}
						placeholder='new name'
						onKeyDown={onKeyDown}
						className='uppercase text-2xl outline-none bg-black'
					/>
					: title}
				</div>
			</span>
			<span className='flex items-center gap-2'>
				<FaPencil
					onClick={() => toggle((prev) => prev?false:true)}
					style={{color: modal?'orange':'yellow'}}
					className='cursor-pointer'
				/>
				{goal 
				? <span onClick={() => toggleGoal(id)}>🎯</span>
				: <LuTarget onClick={() => toggleGoal(id)} className='cursor-pointer text-green-200'/>}
				<RiDeleteBin6Fill onClick={onDelete} className='cursor-pointer text-red-200'/>
			</span>
		</div>
	)
}

export default Topic;

import { FaPencil } from "react-icons/fa6"
import { RiDeleteBin6Fill } from "react-icons/ri"
import { LuTarget } from "react-icons/lu";
import { GiAbstract050 } from "react-icons/gi";
import { useDataStore } from "@state/store";
import { useRef, useState } from "react";

interface TopicProps {
	id: string;
	goal: boolean
	title: string;
}

const Topic: React.FC<TopicProps> = ({
	id,
	goal,
	title,
}: TopicProps): JSX.Element => {

	const deleteTopic = useDataStore((state) => state.deleteTopic)
	const selectTopic = useDataStore((state) => state.setSelected)
	const updateTopic = useDataStore((state) => state.updateTopic)
	const selected = useDataStore((state) => state.selected)
	const toggleGoal = useDataStore((state) => state.toggleGoal)
	const [editModal, toggleEditModal] = useState<boolean>(false)
	const editModalRef = useRef<HTMLInputElement>(null)
	const onConvert = ():void => toggleGoal(id)
	const onDelete = ():void => {if (confirm('Are you sure you want to delete this topic?')) deleteTopic(id)}
	const onSelect = ():void => selectTopic(id)
	const onEnter = ():void => {
		const newTitle = editModalRef.current?.value
		if (newTitle === '' || newTitle === null || newTitle === undefined) return
		updateTopic(id, newTitle)
		toggleEditModal(false)
	}

	return (
		<div
			className={'text-[color:var(--fg-nav)] items-center cusror-pointer flex flex-wrap overflow-hidden border-black border-2 rounded-[30px] relative text-2xl p-3 justify-between '.concat(selected===id?'bg-[color:var(--bg-topic)]':'bg-white')}
			onClick={onSelect}
		>
			<span className='flex items-center gap-2'>
				<div>
					<GiAbstract050 />
				</div>
				<div
					spellCheck='false'
					className='text-ellipsis outline-none uppercase'
				>
					{editModal
					? <input
						ref={editModalRef}
						type='text'
						size={15}
						placeholder='new name'
						onKeyDown={(e) => { if (e.key === 'Enter') onEnter()}}
						className='uppercase text-2xl outline-none bg-[color:var(--bg-topic)]'
					/>
					: title}
				</div>
			</span>
			<span className='flex items-center gap-2'>
				<FaPencil
					onClick={() => toggleEditModal((prev) => prev?false:true)}
					style={{color: editModal?'orange':'brown'}}
					className='cursor-pointer'
				/>
				{goal 
				? <span onClick={onConvert}>🎯</span>
				: <LuTarget onClick={onConvert} className='cursor-pointer text-green-600'/>}
				<RiDeleteBin6Fill onClick={onDelete} className='cursor-pointer text-red-500'/>
			</span>
		</div>
	)
}

export default Topic;

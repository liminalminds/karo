import { ChangeEvent, useRef, useState } from "react";
import { RiDeleteBin6Fill } from "react-icons/ri"
import { useDataStore } from "@state/store";
import { FaPencil } from "react-icons/fa6";
import { SiConvertio } from "react-icons/si";
import { generateId } from "@utils";

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

	const deleteAction = useDataStore((state) => state.deleteAction)
	const updateAction = useDataStore((state) => state.updateAction)
	const createTopic = useDataStore((state) => state.createTopic)
	const toggleCompleted = useDataStore((state) => state.toggleCompleted)
	const [modal, toggleModal] = useState<boolean>(false)
	const modalRef = useRef<HTMLInputElement>(null)
	const onChange = (e:ChangeEvent<HTMLInputElement>):void => toggleCompleted(id, e.target.checked)
	const onClick = ():void => deleteAction(id)
	const onConvert = ():void => {
		if (confirm('Are you sure you want to convert this action into a topic / goal?')) {
			createTopic({id: generateId('tpc'), title:title, goal: true, actions: []})
			deleteAction(id)
		}
	}
	const onEnter = ():void => {
		const newTitle = modalRef.current?.value
		if (newTitle === '' || newTitle === null || newTitle === undefined) return
		updateAction(id, newTitle)
		toggleModal(false)
	}

	return (
			<div className='py-3 px-4 flex text-center justify-between overflow-hidden items-center text-2xl border-2 border-black rounded-[30px] bg-white'>
				<div className='flex items-center gap-3'>
					<input className='h-5 w-5 cursor-pointer accent-fuchsia-600' type='checkbox' defaultChecked={completed} onChange={(e) => onChange(e)}/>
					<div className={completed?'text-left line-through text-gray-500 bg-white':'text-left bg-white'}>
						{modal  && <input
							ref={modalRef}
							type='text'
							className='w-[32rem] text-2xl outline-none bg-white'
							placeholder='new name'
							onKeyDown={(e) => { if (e.key === 'Enter') onEnter()}}
							defaultValue={title}
							autoFocus
						/>}
						{!modal && title}
					</div>
				</div>
				<div className='flex gap-3 bg-white'>
					<FaPencil className='cursor-pointer' style={modal && {color: 'orange'}} onClick={() => toggleModal((prev) => prev?false:true)}/>
					<SiConvertio className='float-right bg-white' onClick={onConvert} />
					<RiDeleteBin6Fill className='float-right bg-white' onClick={onClick} />
				</div>
			</div>
	)
}

export default Action;

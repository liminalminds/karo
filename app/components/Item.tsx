import { ImCheckboxChecked, ImCheckboxUnchecked } from "react-icons/im";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { FaPencil } from "react-icons/fa6";

interface ItemProps {
	item: any,
	toggle: any,
	deleteItem: any,
	editItem: any,
};

const Item = ({item, toggle, deleteItem, editItem}:ItemProps) => {
	return (
		<div className={'my-4 p-3 flex text-center justify-between items-center text-2xl border-2 border-black rounded-[30px] shadow-[4px_6px_1px] bg-white'}>
			<div className='flex items-center gap-3 bg-white'>
				<div className='bg-white' onClick={() => toggle(item.id)}>
					{item.completed && <ImCheckboxChecked />}
					{!item.completed && <ImCheckboxUnchecked />}
				</div>
				<div
					className={item.completed?'line-through text-gray-700 bg-white':'bg-white'}
				>
					{item.title}
				</div>
			</div>
			<div className='flex gap-3 bg-white'>
				{/*<FaPencil className='float-right bg-white' onClick={() => editItem(item.id)} />*/}
				<RiDeleteBin6Fill className='float-right bg-white' onClick={() => deleteItem(item.id)} />
			</div>
		</div>
	)
};

export default Item;

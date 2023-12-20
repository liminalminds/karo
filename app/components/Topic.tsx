import { FaHandPointRight, FaPencil } from "react-icons/fa6";
import { RiDeleteBin6Fill } from "react-icons/ri";

interface TopicProps {id: string, title: string, onClick: any, selected: boolean, deleteTopic:any};

const Topic = ({id, title, onClick, selected, deleteTopic}: TopicProps) => {
	const commonClassName = 'px-3 py-3 text-center font-semibold text-2xl text-ellipsis o-verflow-hidden my-2 flex items-center justify-between'
	const selectedClassName = 'border-black border-2 rounded-[30px]';
	const selectedColor = ' bg-[color:var(--bg-topic)]';
	const unselectedClassName = 'hover:cursor-pointer bg-[color:var(--bg-nav)]';
	const unselectedColor = ' bg-[color:var(--bg-nav)]';
	return (
		<div
			onClick={onClick}
			className={commonClassName  + ' ' + (selected?selectedClassName + selectedColor:unselectedClassName + unselectedColor)}
		>
			<div className={'flex items-center gap-2' + (selected?selectedColor:unselectedColor)}>
				<FaHandPointRight/>
				{title}
			</div>
			<div className={'flex gap-3'}>
				{/*<FaPencil className='float-right' onClick={() => {}} />*/}
				<RiDeleteBin6Fill className='float-right' onClick={() => deleteTopic(id)} />
			</div>
		</div>
	)
};

export default Topic;

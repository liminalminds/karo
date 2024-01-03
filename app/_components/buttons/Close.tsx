import { useDataStore } from "@store";
import { FaCircleXmark } from "react-icons/fa6";

interface CloseProps {
	id: string;
}

const Close:React.FC<CloseProps> = ({id}) => {
	const deleteTopic = useDataStore(state => state.deleteTopic)
	const onClick = ():void => {confirm('Are you sure you want to delete this topic?') && deleteTopic(id)}
	return (
		<div
			className='absolute top-4 right-4 cursor-pointer'
			onClick={onClick}
		>
		<FaCircleXmark className='text-2xl'/>
		</div>
	)
}

export default Close

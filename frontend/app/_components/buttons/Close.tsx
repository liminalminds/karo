import { useDataStore } from "@store";
import { FaCircleXmark } from "react-icons/fa6";
import styles from './Close.module.css';

interface CloseProps {
	id: string;
}

const Close:React.FC<CloseProps> = ({id}) => {
	const deleteTopic = useDataStore(state => state.deleteTopic)
	const onClick = ():void => {confirm('Are you sure you want to delete this topic?') && deleteTopic(id)}
	return (
		<div
			className={styles.close}
			onClick={onClick}
		>
		<FaCircleXmark className={styles.icon}/>
		</div>
	)
}

export default Close

"use client"
const deleteTopic = ({id}: CloseProps) => {}

interface CloseProps {
	id: string | null;
}

const Close:React.FC<CloseProps> = (id) => {
	const onClick = ():void => {confirm('Are you sure you want to delete this topic?') && deleteTopic(id)}
	return (
		<div
			className='absolute top-4 right-4 cursor-pointer'
			onClick={onClick}
		>
		X
		</div>
	)
}

export default Close

import { useDataStore } from "@state/store";

interface GoalProps {
	id: string,
	title: string;
	count: number,
	color: string,
	total: number,
}

interface ProgressBarProps {
	count: number,
	total: number,
	color: string,
}

const StatusBar = ({count, total, color}: ProgressBarProps) => {
	const width = 15;
	const complete  = total !== 0 ? count/total : 0;
	const incomplete = 1 - complete;
	return (
		<div className='flex mx-1 border-2 border-black rounded-xl h-5 p-[2px]'>
			<div className='bg-blue-700' style={{width:complete*width+'rem'}}>
			</div>
			<div className='bg-white' style={{width:incomplete*width+'rem'}}>
			</div>
		</div>
	)
}

const Goal: React.FC<GoalProps> = ({
	id,
	title,
	count,
	total,
	color,
}: GoalProps) => {
	const deleteTopic = useDataStore((state) => state.deleteTopic)
	const onClick = ():void => {confirm('Are you sure you want to delete this topic?') && deleteTopic(id)}
	
	return (
		<div className='flex flex-col items-center justify-center gap-5 p-10 relative overflow-hidden border-2 border-black rounded-[30px] shadow-[4px_6px_1px] bg-white'
	>
		{count === total && total !== 0 && (
				<div
					className='absolute top-4 right-4 cursor-pointer'
					onClick={onClick}
				>
				X
				</div>
			)
		}
		<h2 className='text-3xl'>{title}</h2>
		<h6 className='text-xl'>[{count}/{total}]</h6>
		<StatusBar count={count} total={total} color={color}/>
	</div>
	)
}

export default Goal

import Close from "@components/buttons/Close";

interface GoalProps {
	id: string,
	title: string;
	count: number,
	total: number,
}

interface ProgressBarProps {
	count: number,
	total: number,
}

const StatusBar = ({count, total}: ProgressBarProps) => {
	const width = 15;
	const complete  = total !== 0 ? count/total : 0;
	const incomplete = 1 - complete;
	return (
		<div className='flex mx-1 border-2 border-white rounded-xl h-5 p-[2px]'>
			<div className='bg-pink-300' style={{width:complete*width+'rem'}}>
			</div>
			<div className='bg-black' style={{width:incomplete*width+'rem'}}>
			</div>
		</div>
	)
}

const Goal: React.FC<GoalProps> = ({
	id,
	title,
	count,
	total,
}: GoalProps) => {
	console.log('Goal')
	return (
		<div className='flex flex-col items-center justify-center gap-5 p-10 relative overflow-hidden border-2 border-white rounded-[30px] shadow-[4px_6px_1px] bg-black text-white'
	>
		{count === total && total !== 0 && <Close id={id}/>}
		<h2 className='text-3xl'>{title}</h2>
		<h6 className='text-xl'>[{count}/{total}]</h6>
		<StatusBar count={count} total={total} />
	</div>
	)
}

export default Goal

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
		<div className='flex mx-1 border-2 border-white rounded-xl h-6 p-[1px]'>
			<div className='bg-green-500' style={{width:complete*width+'rem'}}>
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
	const pct = () => {
		let pct
		if (total === 0) {
			pct = '¯\\_(ツ)_/¯'
		} else {
			pct = (count/total * 100).toFixed(2).toString() + ' %'
		}
		return pct
	}
	return (
		<div className='flex flex-col items-center justify-center gap-5 p-10 relative overflow-hidden border-2 border-white rounded-[30px] shadow-[4px_6px_1px] bg-transparent text-white'>
			{count === total && total !== 0 && <Close id={id}/>}
			<h2 className='text-2xl font-pixelify text-purple-400'>{title}</h2>
			<h3 className='text-xl font-pixelify text-blue-500'>{pct()}</h3>
			<h6 className='text-l text-center'>
				Completed <strong>{count}</strong> of <strong>{total}</strong>
			</h6>
			<StatusBar count={count} total={total} />
		</div>
	)
}

export default Goal

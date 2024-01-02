import { InputAction } from "@components/input/InputAction";
import Menu from "@components/menu/Menu";
import ActionList from "@components/actions/ActionList";

const ActionBar: React.FC = () => {
	console.log('ActionBar')
	return (
		<section id='actions' className='w-1/2 bg-black overflow-y-scroll'>
			<div className='my-[1.75rem] mx-auto'>
				<Menu />
			</div>
			<div className='p-3 mx-4 relative bg-black shadow-[4px_6px_1px] border-2 border-white rounded-[30px] text-white'>
				<InputAction />
			</div>
			<ActionList />
		</section>
	)
}

export default ActionBar;

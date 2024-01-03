import { InputAction } from "@components/input/InputAction";
import Menu from "@components/menu/Menu";
import ActionList from "@components/actions/ActionList";

const ActionBar: React.FC = () => {
	return (
		<section id='actions' className='w-1/2 bg-transparent overflow-y-scroll text-white'>
			<div className='my-[1.75rem] mx-auto'>
				<Menu />
			</div>
			<div className='p-3 mx-4 relative bg-transparent shadow-[4px_6px_1px] border-2 border-white rounded-[30px] text-white'>
				<InputAction />
			</div>
			<ActionList />
		</section>
	)
}

export default ActionBar;

"use client";
import {useState, useRef} from 'react';

interface Item {
	id: number,
	title: string,
	completed: boolean,
}

let data:Array<Item> = [];

const App = () => {

	const itemRef = useRef<HTMLInputElement | null>(null);

	const [items, setItems] = useState(data);
	const [count, setCount] = useState(data.length);

	const onClick = () => {
		// null value cannot be pushed
		if (itemRef.current == null) return;
		const newItem = itemRef.current.value;
		itemRef.current.value = '';
		// empty values cannot be puhsed
		if (newItem == '') return;
		setCount(prev => prev+1)
		setItems([...items, {
				id: count+1,
				title: newItem,
				completed: false,
			}
		])
		itemRef.current.focus();
	};

	const toggleComplete = (itemId:number) => {
		setItems(items.map(item => {
			if (item.id === itemId) {
				return {...item, completed:item.completed?false:true};
			}
			else{
				return item;
			}
		})
		)
		console.log('toggling')
	};

	const deleteItem = (itemId:number) => {
		setItems(items.filter(item => {
			if (item.id !== itemId) {
				return item;
			}
		}))
		console.log('toggling')
	};

	return (
		<main>
			<h1 className='text-center py-10'>JDI</h1>
			<section className='text-center'>
				<input autoFocus onKeyDown={(e) => {if(e.key === 'Enter') onClick()}} ref={itemRef} type='text' className='text-black border-none text-s'></input>
				<button onClick={onClick} className='bg-gray-400 px-4 border border-black text-black '>+</button>
			</section>
			<section className='flex flex-col ml-[30%]'>
			{items.map(item => {
				return (
					<span key={item.id} className='flex'>
						<div onClick={() => toggleComplete(item.id)} className='pr-4 hover:cursor-pointer'>{item.completed?"☒":"☐"}</div>
						<div onClick={() => deleteItem(item.id)} className='pr-4 hover:cursor-pointer'>X </div>
						<div>{item.title}</div>
					</span>
				)
			})}
			</section>
		</main>
	)
}

export default App;

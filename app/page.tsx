"use client";

import "crypto";
import {useState, useRef, useEffect} from 'react';
import { FaHandPointRight } from "react-icons/fa6";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { ImCheckboxChecked, ImCheckboxUnchecked } from "react-icons/im";

interface Topic {
	id: string,
	title: string,
	items: Array<Item>
};

interface Item {
	id: string,
	title: string,
	completed: boolean,
}

const commonClassName = 'px-3 py-3 text-center font-semibold text-2xl text-ellipsis o-verflow-hidden my-2 flex items-center justify-between'
const selectedClassName = 'border-black border-2 rounded-[30px]';
const selectedColor = ' bg-[color:var(--bg-topic)]';
const unselectedClassName = 'hover:cursor-pointer bg-[color:var(--bg-nav)]';
const unselectedColor = ' bg-[color:var(--bg-nav)]';

const App = () => {

	const itemRef  = useRef<HTMLInputElement | null>(null);
	const topicRef = useRef<HTMLInputElement | null>(null);
	const initialRender = useRef(true);

	const [dataState, setDataState] = useState<Array<Topic>>([]);
	const [selected, selectTopic] = useState<string>('__tpc');

	useEffect(() => {
		const data = window.localStorage.getItem('jdi_todo_app_data');
		const selection = window.localStorage.getItem('jdi_todo_app_selected');
		if (data != null) {
			setDataState(JSON.parse(data));
		}
		if (selection != null) {
			selectTopic(selection);
		}
	}, []);

	useEffect(() => {
		if (initialRender.current) {
			initialRender.current = false;
			return;
		}
		window.localStorage.setItem('jdi_todo_app_data', JSON.stringify(dataState));
		window.localStorage.setItem('jdi_todo_app_selected', JSON.stringify(selected));
	}, [dataState, selected]);

	const generateId = (prefix: string) => prefix + "_" + crypto.randomUUID().toString().replaceAll('-','');

	const getItems = (topicId: string) => {
		for (let i = 0; i < dataState.length; i++) {
			if (dataState[i].id === topicId) {
				return dataState[i].items
			}
		}
		return [];
	};

	/*
	const editItem = (itemId:string, newTitle: string) => {
		for (let i = 0; i < dataState.length; i++) {
			if (dataState[i].id === selected) {
				const items = dataState[i].items
				for (let i = 0; i < items.length; i++) {
					if (items[i].id == itemId) {
						items[i] = {...items[i], title:newTitle};
					}
				}
			}
		}
		setDataState([...dataState]);
	};
	*/

	/*
	const convertItemtoTopic = (itemName: string) => {
		let topic = {
			id: generateId('tpc'),
			title: itemName,
			items: [],
		};
		setDataState([...dataState, topic]);
	};
	*/

	/*
	const renameTopic = (topicId: string, topicName: string) => {
		for (let i = 0; i < dataState.length; i++) {
			if (dataState[i].id === topicId) {
				dataState[i].title = topicName;
				break;
			}
		}
		setDataState([...dataState]);
	}
	*/

	/*
	const clearCompleteItems = (all:boolean) => {
		for (let i = 0; i < dataState.length; i++) {
			if (dataState[i].id === selected && !all) {
				dataState[i].items = dataState[i].items.filter(item => item.completed)
			}
		}
	};
	*/

	const createTopic = () => {
		if (topicRef.current == null) return;
		if (topicRef.current.value === '') return;
		console.log(topicRef.current.value);
		const topicName = topicRef.current?.value;
		let topic = {
			id: generateId('tpc'),
			title: topicName,
			items: [],
		};
		setDataState([...dataState, topic]);
		topicRef.current.focus();
		topicRef.current.value = '';
		selectTopic(topic.id);
	};

	const deleteTopic = (topicId: string) => {
		var newSelect = selected;
		for (let i = 0; i < dataState.length; i++) {
			if (dataState[i].id === topicId) {
				dataState.splice(i, 1);
				newSelect = dataState[i===0?i:i-1].id;
				break;
			}
		}
		setDataState([...dataState]);
		selectTopic(newSelect);
	};

	const createItem = () => {
		if (itemRef.current == null) return;
		const newItem = itemRef.current.value;
		itemRef.current.value = '';
		if (newItem == '') return;

		let item = {
			id: generateId('itm'),
			title: newItem,
			completed: false,
		};
		for (let i = 0; i < dataState.length; i++) {
			if (dataState[i].id === selected) {
				dataState[i].items.push(item);
				break;
			}
		}
		setDataState([...dataState]);
		itemRef.current.focus();
	};

	const toggleComplete = (itemId:string) => {
		for (let i = 0; i < dataState.length; i++) {
			if (dataState[i].id === selected) {
				const items = dataState[i].items
				for (let i = 0; i < items.length; i++) {
					if (items[i].id == itemId) {
						items[i] = {...items[i], completed:items[i].completed?false:true};
					}
				}
			}
		}
		setDataState([...dataState]);
	};

	const deleteItem = (itemId:string) => {
		for (let i = 0; i < dataState.length; i++) {
			if (dataState[i].id === selected) {
				dataState[i].items = dataState[i].items.filter(item => {
					if (item.id !== itemId) {
						return item;
					}
				})
			}
		}
		setDataState([...dataState]);
	};

	return (
		<main className='flex bg-[color:var(--bg-theme)]'>

			<section className='w-1/4 h-screen bg-[color:var(--bg-nav)] fg-[color:var(--fg-nav)] text-center px-6 overflow-y-scroll'>

				<h1 className='font-semibold mt-10 text-6xl bg-[color:var(--bg-nav)]'>
					JDI
				</h1>

				<aside className='flex flex-col bg-white'>

					<input
						className='text-2xl py-3 my-6 border-box px-3 bg-[color:var(--bg-nav)] shadow-[4px_6px_1px] border-2 border-black rounded-[30px] outline-none'
						onKeyDown={(e) => {if(e.key === 'Enter') createTopic()}}
						ref={topicRef}
						type='text'
						placeholder="New ...">
					</input>

					<section>
						{dataState.map(topic => {
							return (
								<div
									key={topic.id}
									onClick={() => selectTopic(topic.id)}
									className={commonClassName  + ' ' + (selected === topic.id?selectedClassName + selectedColor:unselectedClassName + unselectedColor)}
								>
									<div className={'flex items-center gap-2' + (selected === topic.id?selectedColor:unselectedColor)}>
										<FaHandPointRight/>
										{topic.title}
									</div>
									<div className={'flex gap-3'}>
										{/*<FaPencil className='float-right' onClick={() => {}} />*/}
										<RiDeleteBin6Fill className='float-right' onClick={() => deleteTopic(topic.id)} />
									</div>
								</div>
							)
						})}
					</section>

				</aside>

			</section>

			<section className='relative w-full m-14 mt-10'>

				<input
					autoFocus
					onKeyDown={(e) => {if(e.key === 'Enter') createItem()}}
					ref={itemRef}
					className='relative w-full flex bg-[color:var(--bg-theme) items-center justify-center text-2xl p-3 bg-[color:var(--bg-nav)] shadow-[4px_6px_1px] border-2 border-black rounded-[30px] outline-none'
					placeholder='Write an actionable item or a long term goal?'
					type='text'
				>
				</input>

				<article>
					{getItems(selected).map(item => {
						return (
							<div
								key={item.id}
								className={'my-4 p-3 flex text-center justify-between items-center text-2xl border-2 border-black rounded-[30px] shadow-[4px_6px_1px] bg-white'}
							>
								<div className='flex items-center gap-3 bg-white'>
									<div className='bg-white' onClick={() => toggleComplete(item.id)}>
										{item.completed && <ImCheckboxChecked />}
										{!item.completed && <ImCheckboxUnchecked />}
									</div>
									<div className={item.completed?'line-through text-gray-700 bg-white':'bg-white'}>
										{item.title}
									</div>
								</div>
								<div className='flex gap-3 bg-white'>
									{/*<FaPencil className='float-right bg-white' onClick={() => editItem(item.id)} />*/}
									{/*<FaPencil className='float-right bg-white' onClick={() => editItem(item.id)} />*/}
									<RiDeleteBin6Fill className='float-right bg-white' onClick={() => deleteItem(item.id)} />
								</div>
							</div>
						)
					})}
				</article>

			</section>

		</main>
	)
}

export default App;

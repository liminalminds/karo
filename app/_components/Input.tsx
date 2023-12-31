"use client"
import { useRef } from "react"
import { useDataStore } from "@state/store"
import { generateId } from "@utils"
import { IAction, ITopic } from "@types"
import { toast } from "react-toastify"

export const InputTopic: React.FC = () => {

	const topicRef = useRef<HTMLInputElement>(null)
	const createTopic = useDataStore((state) => state.createTopic)
	const selectTopic = useDataStore((state) => state.setSelected)
	const onEnter = () => {
		const title = topicRef.current?.value.toUpperCase()
		if (topicRef.current == null) return
		if (title == '' || title == undefined) return
		const topicId = generateId('tpc')
		const topic: ITopic = {id: topicId, title: title, actions:[], goal: false}
		createTopic(topic)
		topicRef.current.value = ''
		selectTopic(topic.id)
	}

	return (
		<input
			ref={topicRef}
			onKeyDown={(e) => {if(e.key === 'Enter') onEnter()}}
			className='px-3 outline-none w-full text-2xl'
			placeholder='New Topic'
			type='text'
		/>
	)
}

export const InputAction: React.FC = () => {

	const actionRef = useRef<HTMLInputElement>(null)
	const createAction = useDataStore((state) => state.createAction)
	const selected = useDataStore((state) => state.selected)
	const onEnter = () => {
		const title = actionRef.current?.value
		if (actionRef.current == null) return
		if (title == null || title.trimStart() === '') {
			toast.info('Name your task', {theme: 'dark'})
			return
		}
		if (selected == null) {
			toast.info('Create a Topic first')
		}
		const actionId = generateId('act')
		const action: IAction = {id: actionId, title: title, completed: false}
		createAction(action)
		actionRef.current.value = ''
	}

	return (
		<input
			ref={actionRef}
			onKeyDown={(e) => {if(e.key === 'Enter') onEnter()}}
			className='px-3 outline-none w-full text-2xl'
			placeholder='Write an action item ...'
			type='text'
		/>
	)
}

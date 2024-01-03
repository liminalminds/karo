"use client"
import { KeyboardEvent, useRef } from "react"
import { generateId } from "@utils"
import { ITopic } from "@types"
import { useDataStore } from "@store"

export const InputTopic: React.FC = () => {
	const createTopic = useDataStore(state => state.createTopic)
	const setSelected = useDataStore(state => state.setSelected)
	const ref = useRef<HTMLInputElement>(null)
	const onKeyDown = async (e: KeyboardEvent) => {
		if (e.key !== 'Enter') return
		if (ref.current == null) return
		const title = ref.current?.value.toUpperCase()
		if (title == '' || title == undefined) return
		const topicId = await generateId('tpc')
		const topic: ITopic = {id: topicId, title: title, actions:[], goal: false}
		createTopic(topic)
		ref.current.value = ''
		setSelected(topic.id)
	}
	return (
		<input
			ref={ref}
			enterKeyHint="enter"
			onKeyDown={onKeyDown}
			className='px-3 outline-none w-full text-2xl bg-transparent'
			placeholder='New Topic'
			type='text'
		/>
	)
}

"use client"
import { KeyboardEvent, useRef } from "react"
import { generateId } from "@utils"
import { toast } from "react-toastify"
import { ToastConfig } from "@components/toast"
import { useDataStore } from "@store"

export const InputAction: React.FC = (): JSX.Element => {
	const createAction = useDataStore((state) => state.createAction)
	const ref = useRef<HTMLInputElement>(null)
	const onKeyDown = async (e: KeyboardEvent) => {
		if (e.key !== 'Enter') return
		const title = ref.current?.value
		if (ref.current == null) return
		if (title == null || title.trimStart() === '') {
			toast.info('Name Your Task', ToastConfig)
			return
		}
		const actionId = await generateId('act')
		createAction({
			id: actionId,
			title: title,
			completed: false
		})
		ref.current.value = ''
	}

	return (
		<input
			ref={ref}
			enterKeyHint="enter"
			onKeyDown={onKeyDown}
			className='px-3 outline-none w-full text-2xl bg-transparent'
			placeholder='Write an action item ...'
			type='text'
		/>
	)
}

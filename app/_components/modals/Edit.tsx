"use client"
import { KeyboardEvent, useRef } from "react"

interface EditProps {
	defaultValue: string;
	placeholder: string;
	autoFocus: boolean;
	callback: Function
}

const Edit: React.FC<EditProps> = ({defaultValue, placeholder, autoFocus, callback}) => {
	const ref = useRef<HTMLInputElement>(null)
	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key !== 'Enter') return
		ref.current && callback(ref.current?.value)
	}
	return (
		<input
			ref={ref}
			type='text'
			className='w-[32rem] text-2xl outline-none bg-black'
			placeholder={placeholder}
			onKeyDown={(e) => onKeyDown(e)}
			defaultValue={defaultValue}
			autoFocus={autoFocus}
		/>
	)
}

export default Edit

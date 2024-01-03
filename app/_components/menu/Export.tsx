"use client"
import { useDataStore } from "@store"
import { FaFloppyDisk } from "react-icons/fa6"

const Export:React.FC = ():JSX.Element => {
	const topics = useDataStore(state => state.topics)
	const url = ():string => {
		let href = '#'
		let blob = null
		if (topics.length !== 0) {
			blob = new Blob([JSON.stringify(topics, null, 2)], {type: 'application/json'})
			href = URL.createObjectURL(blob)
		}
		return href
	}

	return (
		<a href={url()} target='_blank' download tabIndex={-1}><FaFloppyDisk className='text-white hover:text-yellow-400 duration-300'/></a>
	)
}

export default Export

"use client"
import { ChangeEvent, Fragment } from "react"
import { FaFileImport } from "react-icons/fa6"
import { useDataStore } from "@store"

const Import: React.FC = () => {
	const setTopics = useDataStore(state => state.setTopics)
	const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
		let file = null
		if (e.target.files) file = e.target.files[0]
		if (file) {
			const fileTopics = JSON.parse(await file.text())
			setTopics(fileTopics, confirm('Do you want to keep the existing data?'))
		}
	}
	return (
		<Fragment>
		 <label htmlFor='import'><FaFileImport className='text-white'/></label>
		 <input type='file' onChange={onChange} className='w-0 h-0 hidden'/>
	 </Fragment>
	)
}

export default Import

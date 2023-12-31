"use client"
import { FaFileImport, FaFloppyDisk, FaCircleInfo } from "react-icons/fa6"
import { useDataStore } from "@state/store"
import { ChangeEvent, useState } from "react"
import AboutModal from "@components/AboutModal"

const Menu: React.FC = () => {

	const data = useDataStore((state) => state.data)
	const [aboutModal, toggleAboutModal] = useState<boolean>(false)

	const onClick = (e: ChangeEvent<HTMLInputElement>) => {
		let file = null
		if (e.target.files) {
			file = e.target.files[0]
		}
		if (file) {
			if (confirm('Do you want to keep the existing data?')) {
				console.log('Overwriting')
			}
			else {
				console.log('Discarding')
			}
		}

	}

	const getHref = ():string => {
		let href = '#'
		let blob = null
		if (data.length !== 0) {
			blob = new Blob([JSON.stringify(data)], {type: 'application/json'})
			href = URL.createObjectURL(blob)
		}
		else {
			href = '#'
			blob = null
		}
		return href
	}

	return (
		<ul className='text-4xl flex gap-32 justify-center items-center'>
			{// <li>
			 //  <label htmlFor='import'><FaFileImport /></label>
			 //  <input id='import' type='file' onChange={onClick} className='w-0 h-0 hidden'/>
			 // </li>
			}
			<li><a href={getHref()} target='_blank' download='jdi_data.json'><FaFloppyDisk /></a></li>
			<li><FaCircleInfo onClick={() => toggleAboutModal(prev => !prev)}/></li>
			{aboutModal && <AboutModal />}
		</ul>
	)
}

export default Menu

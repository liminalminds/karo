import { FaFileImport, FaFloppyDisk, FaCircleInfo } from "react-icons/fa6"
import { useDataStore } from "@state/store"
import { ChangeEvent, useState, useRef, useEffect } from "react"
import AboutModal from "@components/AboutModal"

const Menu: React.FC = () => {
	const data = useDataStore((state) => state.data)
	const setData = useDataStore((state) => state.setData)
	const [aboutModal, toggleAboutModal] = useState<boolean>(false)
	const ref = useRef(null)
	useEffect(() => {
	}, [])
	const onClick = async (e: ChangeEvent<HTMLInputElement>) => {
		let file = null
		if (e.target.files) {
			file = e.target.files[0]
		}
		if (file) {
			const fileTopics = JSON.parse(await file.text())
			console.log(fileTopics)
			if (confirm('Do you want to keep the existing data?')) {
				setData([...data, ...fileTopics])
			}
			else {
				setData(fileTopics)
			}
		}
	}
	const getHref = ():string => {
		let href = '#'
		let blob = null
		if (data.length !== 0) {
			blob = new Blob([JSON.stringify(data)], {type: 'application/json'})
			href = URL.createObjectURL(blob)
		} else {
			href = '#'
			blob = null
		}
		return href
	}
	return (
		<ul className='text-4xl flex gap-32 justify-center items-center'>
			<li>
			 <label htmlFor='import'><FaFileImport /></label>
			 <input id='import' type='file' onChange={onClick} className='w-0 h-0 hidden'/>
			</li>
			<li><a href={getHref()} target='_blank' download='jdi_data.json' tabIndex={-1}><FaFloppyDisk /></a></li>
			<li><FaCircleInfo onClick={() => toggleAboutModal(prev => !prev)}/></li>
			<div ref={ref}>
			{aboutModal && <AboutModal />}
			</div>
		</ul>
	)
}

export default Menu

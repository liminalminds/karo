import { MutableRefObject, useEffect } from "react"

const useExtAlerter = (ref: MutableRefObject<HTMLDivElement>, callback: Function) => {
	useEffect(() => {
		const handleClick = (e:any) => {
			ref.current && !ref.current?.contains(e.target) && callback()
			document.addEventListener("click", handleClick)
			return () => {
				document.removeEventListener("click", handleClick)
			}
		}
	}, [ref])
}

const AboutModal:React.FC = ():JSX.Element => {
	return (
		<article className='fixed z-50 top-1/4 p-10 overflow-hidden border-2 border-black rounded-[30px] shadow-[4px_6px_1px] bg-lime-200'>
			<h1 className='text-2xl underline uppercase'>ABOUT</h1>
			<p className='text-xl mt-10'>
				This is a ToDo list manager in NextJS.
				<br/>
				For feedbacks, please <a href='https://github.com/liminalminds/jdi' target='_blank' className='underline'>raise an issue</a> or write a quick <a href='mailto:liminalminds@protonmail.com' target='_blank' className='underline'>email</a>.
				<br/>
				Good Luck.
			</p>
		</article>
	)
}

export default AboutModal

import About from "@components/modals/About"
import Export from "@components/menu/Export"
import Info from "@components/menu/Info"
import Import from "@components/menu/Import"

const Menu: React.FC = () => {
	console.log('Menu')
	return (
		<ul className='text-4xl flex gap-32 justify-center items-center'>
			<li><Import /></li>
			<li><Export /></li>
			<li>
				<Info>
					<About />
				</Info>
			</li>
		</ul>
	)
}

export default Menu

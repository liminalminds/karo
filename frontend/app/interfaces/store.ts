import IOptions from "@interfaces/options"
import IQuest from "@interfaces/quest"

export default interface IStore {
	quests: Array<IQuest>
	selected: string | null
	options: IOptions
}

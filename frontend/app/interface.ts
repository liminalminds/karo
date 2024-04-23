export interface ITask {
	id: string
	text: string;
	completed: boolean;
}

export interface IQuest {
	id: string
	name: string
	tasks: Array<ITask>
}

export interface IOptions {
	moveCompletedToBottom: boolean
	addNewOnTop: boolean
}

export interface IStore {
	quests: Array<IQuest>
	selected: string | null
	options: IOptions
}

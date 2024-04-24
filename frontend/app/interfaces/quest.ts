import ITask from "@interfaces/task"

export default interface IQuest {
	id: string
	name: string
	tasks: Array<ITask>
}

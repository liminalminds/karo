export interface ITask {
	id: string
	text: string;
	completed: boolean;
}

export interface IQuest {
	id: string
	name: string
	tasks: ITask
}

export interface IMiniReportProps{
	total: number
	complete: number
}

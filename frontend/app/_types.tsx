export interface IAction {
	id: string,
	title: string,
	completed: boolean,
}

export interface ITopic {
	id: string,
	title: string,
	actions: Array<IAction>
	goal: boolean,
};

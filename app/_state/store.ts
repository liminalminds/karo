import { IAction, ITopic } from "@types"
import { create } from "zustand"
import { persist } from "zustand/middleware"

type State = {
	data: Array<ITopic>,
	selected: string | null,
}

type Actions = {
	createTopic: (topic: ITopic) => void,
	setSelected: (topicId: string) => void,
	setData: (topics: Array<ITopic>) => void,
	toggleGoal: (topicId: string) => void,
	toggleCompleted: (actionId: string, checked: boolean) => void,
	deleteTopic: (topicId: string) => void,
	createAction: (action: IAction) => void,
	deleteAction: (actionId: string) => void,
	updateTopic: (topicId: string, title: string) => void,
	updateAction: (actionId: string, title:string) => void,
}

export const useDataStore = create<State & Actions>()(
	persist(
		(set) => ({
				data: [],
				selected: null,
				toggleGoal: (topicId: string) => {
					set((state) => {
						for (let i = 0; i < state.data.length; i++) {
							if (state.data[i].id === topicId) {
								state.data[i].goal = state.data[i].goal?false:true
								break
							}
						}
						return {data: [...state.data], selected: state.selected}
					})
				},
				setData: (topics: Array<ITopic>) => {
					set((state) => ({...state, data:topics}))
				},
				toggleCompleted: (actionId: string, checked: boolean) => {
					set((state) => {
						for (let i = 0; i < state.data.length; i++) {
							if (state.data[i].id === state.selected) {
								state.data[i].actions.forEach((action) => {
									if (action.id === actionId) {
										action.completed = checked
									}
								})
							}
						}
						return {data: [...state.data], selected: state.selected}
					})
				},
				setSelected: (topicId: string) => {
					set((state) => {
						return {...state, selected: topicId}
					})
				},
				createTopic: (topic: ITopic) => {
					set((state) => {
						return {
						data: [
							...state.data,
							{
								id: topic.id,
								title:topic.title,
								actions:[],
								goal: false,
							}
						],
						selected: state.selected
					}})
				},
				deleteTopic: (topicId: string) => {
					set((state) => ({data: state.data.filter((topic) => topic.id != topicId), selected: state.selected}))
				},
				createAction: (action: IAction) => {
					set((state) => {
						for (let i = 0; i < state.data.length; i++) {
							if (state.data[i].id === state.selected) {
								state.data[i].actions.push(action)
								break
							}
						}
						return {data: [...state.data], selected: state.selected}
					})
				},
				deleteAction: (actionId: string) => {
					set((state) => {
						for (let i = 0; i < state.data.length; i++) {
							if (state.data[i].id === state.selected) {
								state.data[i].actions = state.data[i].actions.filter((action) => action.id !== actionId)
								break;
							}
						}
						return {data: [...state.data], selected: state.selected}
					})
				},
				updateAction: (actionId: string, title: string) => {
					set((state) => {
						for (let i = 0; i < state.data.length; i++) {
							if (state.data[i].id === state.selected) {
								state.data[i].actions.forEach((action) => {
									if (action.id === actionId) {
										action.title = title
									}
								})
							}
						}
						return {data: [...state.data], selected: state.selected}
					})
				},
				updateTopic: (topicId:string, title:string) => {
					set((state) => {
						for (let i = 0; i < state.data.length; i++) {
							if (state.data[i].id === topicId) {
								state.data[i].title = title
								break;
							}
						}
						return {data: [...state.data], selected: state.selected}
					})
				},
		}),
		{
			name: 'JDI',
			skipHydration:true,
		}
	)
)

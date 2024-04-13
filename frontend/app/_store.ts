import { IAction, ITopic } from "@types"
import { create } from "zustand"
import { persist } from "zustand/middleware"

type State = {
	topics: Array<ITopic>,
	selected: string | null,
}

type Actions = {
	setTopics: (topics: Array<ITopic>, overwrite: boolean) => void,
	setSelected: (topicId: string) => void,
	createTopic: (topic: ITopic) => void,
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
				topics: [],
				selected: null,
				setTopics: (topics: Array<ITopic>, overwrite: boolean) => {
					set((state) => (
						overwrite
						? {...state, topics:topics}
						: {...state, topics:[...state.topics, ...topics]}
					))
				},
				setSelected: (topicId: string) => {
					set((state) => {
						return {...state, selected: topicId}
					})
				},
				createTopic: (topic: ITopic) => {
					set((state) => {
						return {
						topics: [
							...state.topics,
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
				toggleGoal: (topicId: string) => {
					set((state) => {
						for (let i = 0; i < state.topics.length; i++) {
							if (state.topics[i].id === topicId) {
								state.topics[i].goal = state.topics[i].goal?false:true
								break
							}
						}
						return {topics: [...state.topics], selected: state.selected}
					})
				},
				toggleCompleted: (actionId: string, checked: boolean) => {
					set((state) => {
						for (let i = 0; i < state.topics.length; i++) {
							if (state.topics[i].id === state.selected) {
								state.topics[i].actions.forEach((action) => {
									if (action.id === actionId) {
										action.completed = checked
									}
								})
							}
						}
						return {topics: [...state.topics], selected: state.selected}
					})
				},
				deleteTopic: (topicId: string) => {
					set((state) => ({topics: state.topics.filter((topic) => topic.id != topicId), selected: state.selected}))
				},
				createAction: (action: IAction) => {
					set((state) => {
						for (let i = 0; i < state.topics.length; i++) {
							if (state.topics[i].id === state.selected) {
								state.topics[i].actions.push(action)
								break
							}
						}
						return {topics: [...state.topics], selected: state.selected}
					})
				},
				deleteAction: (actionId: string) => {
					set((state) => {
						for (let i = 0; i < state.topics.length; i++) {
							if (state.topics[i].id === state.selected) {
								state.topics[i].actions = state.topics[i].actions.filter((action) => action.id !== actionId)
								break;
							}
						}
						return {topics: [...state.topics], selected: state.selected}
					})
				},
				updateAction: (actionId: string, title: string) => {
					set((state) => {
						for (let i = 0; i < state.topics.length; i++) {
							if (state.topics[i].id === state.selected) {
								state.topics[i].actions.forEach((action) => {
									if (action.id === actionId) {
										action.title = title
									}
								})
							}
						}
						return {topics: [...state.topics], selected: state.selected}
					})
				},
				updateTopic: (topicId:string, title:string) => {
					set((state) => {
						for (let i = 0; i < state.topics.length; i++) {
							if (state.topics[i].id === topicId) {
								state.topics[i].title = title
								break;
							}
						}
						return {topics: [...state.topics], selected: state.selected}
					})
				},
		}),
		{
			name: 'JDI',
			skipHydration:true,
		}
	)
)

import { IStore } from "./interface"
import { create } from "zustand"
import { persist } from "zustand/middleware"

type State = {
	data: IStore
}

type Action = {
	setData: (data: IStore, overwrite: boolean) => void
}

export const useStore = create<State & Action>()(
	persist(
		(set) => ({
			data: {
				quests: [],
				selected: null,
				options: {
					addNewOnTop: false,
					moveCompletedToBottom: false
				},
			},
			setData: (data: IStore, overwrite: boolean) => {
				set((state) => (
					overwrite
					? {...state, quests: data.quests}
					: {...state, quests: [...state.data.quests, ...data.quests]}
				))
			},
		}),
		{
			name: 'karo2',
			skipHydration: true,
		}
	)
)

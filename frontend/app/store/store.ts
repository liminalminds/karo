import IStore from "@interfaces/store"
import { create } from "zustand"
import { persist } from "zustand/middleware"

type State = {
	data: IStore
}

type Action = {
	setData: (data: IStore) => void
}

export const useStore = create<State & Action>()(
	persist(
		(set) => ({
			data: {
				quests: [{id: "0", name: "MISC", tasks: []}],
				selected: "0",
				options: {
					addNewOnTop: false,
					moveCompletedToBottom: false
				},
			},
			setData: (data: IStore) => {
				set((state) => {
					return {...state, data: data}}
				)
			}
		}),
		{
			name: "KARO",
			skipHydration: true,
		}
	)
)

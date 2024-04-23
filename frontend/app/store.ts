import { IStore } from "./interface"
import { create } from "zustand"
import { persist } from "zustand/middleware"

type State = {
	data: IStore | any
}

type Action = {
	setData: (data: IStore) => any
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
					console.log(state) // incor
					console.log(data) // correct
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

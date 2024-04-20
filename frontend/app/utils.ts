import { v4 } from 'uuid';

export function genId(prefix: string):string {
	return prefix + v4()
}

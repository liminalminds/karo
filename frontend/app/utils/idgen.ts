import { v4 } from 'uuid';

export default function idgen(prefix: string):string {
	return prefix + v4()
}

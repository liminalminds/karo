import 'crypto';

export const generateId = (prefix: string) => prefix + "_" + crypto.randomUUID().toString().replaceAll('-','')

import 'crypto';

export const generateId = async (prefix: string) => prefix + "_" + crypto.randomUUID().toString().replaceAll('-','')

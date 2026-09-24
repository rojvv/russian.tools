/** Small static partitions keep full dictionary parsing out of Worker requests. */
export const indexPartitions = 4096;
export const entryPartitionSize = 32;
export function indexPartition(key: string): string {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) hash = Math.imul(hash ^ key.charCodeAt(i), 16777619);
  return ((hash >>> 0) % indexPartitions).toString(16).padStart(3, "0");
}

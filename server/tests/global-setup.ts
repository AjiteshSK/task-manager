import { MongoBinary } from 'mongodb-memory-server';

// Runs once, before Vitest starts the workers that run the test files in parallel. Each file
// starts its own in-memory MongoDB, and without a cached binary (e.g. on a fresh CI runner) they
// would all download it at the same time and could break each other's download. Downloading it
// here first means the workers always find the binary already in the cache.
export default async function setup() {
  await MongoBinary.getPath();
}

import { createRequestHandler } from 'expo-server/adapter/vercel';
import path from 'node:path';

module.exports = createRequestHandler({
  build: path.join(__dirname, '../dist/server'),
});

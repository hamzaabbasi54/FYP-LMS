import { connectRedis, cacheDelPattern } from './config/redis.js';

async function flushContacts() {
    try {
        console.log('Connecting to Redis...');
        await connectRedis();
        console.log('Connected! Deleting stale contact caches...');
        await cacheDelPattern('messages:contacts:*');
        console.log('Cache cleared successfully!');
    } catch (e) {
        console.error('Failed to flush cache:', e);
    } finally {
        process.exit(0);
    }
}

flushContacts();

const fs = require('fs');
const path = require('path');

const checkpointPath = path.join(__dirname,'..', 'config', 'data_quality_config', 'checkpoint.json');

// config: điều chỉnh theo nhu cầu
const DEFAULT_FLUSH_INTERVAL_MS = 1000; // flush sau 1s nếu không đạt ngưỡng
const DEFAULT_FLUSH_THRESHOLD = 100; // flush ngay khi >= 100 record được mark

let flushIntervalMs = DEFAULT_FLUSH_INTERVAL_MS;
let flushThreshold = DEFAULT_FLUSH_THRESHOLD;

let data = {};
try {
    const raw = fs.readFileSync(checkpointPath, 'utf8');
    data = raw ? JSON.parse(raw) : {};
} catch (err) {
    data = {};
}

const maps = {};
for (const t of Object.keys(data)) {
    maps[t] = new Map(Object.entries(data[t] || {}));
}

let pendingCount = 0;
let dirty = false;
let flushTimer = null;
let flushingPromise = null;

function getMap(table) {
    if (!maps[table]) {
        maps[table] = new Map();
        data[table] = {};
    }
    return maps[table];
}

function mark(table, id, hash) {
    const m = getMap(table);
    if (!m.has(id)) {
        m.set(id, hash);
        data[table] = Object.fromEntries(m);
        dirty = true;
        pendingCount++;
        // nếu đạt threshold, flush ngay
        if (pendingCount >= flushThreshold) {
            return flushAsync();
        }
        // schedule debounce flush if not scheduled
        scheduleFlush();
    }
    return Promise.resolve();
}

function scheduleFlush() {
    if (flushTimer) return;
    flushTimer = setTimeout(() => {
        flushTimer = null;
        flushAsync().catch(() => { /* swallow, caller can inspect logs */ });
    }, flushIntervalMs);
}

async function flushAsync() {
    if (!dirty) return;
    if (flushingPromise) return flushingPromise;

    const tmp = checkpointPath + '.tmp';
    const payload = JSON.stringify(data, null, 2);

    flushingPromise = fs.promises.writeFile(tmp, payload, 'utf8')
        .then(() => fs.promises.rename(tmp, checkpointPath))
        .then(() => {
            dirty = false;
            pendingCount = 0;
            flushingPromise = null;
        })
        .catch(err => {
            flushingPromise = null;
            throw err;
        });

    return flushingPromise;
}

function flushSync() {
    if (!dirty) return;
    const tmp = checkpointPath + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmp, checkpointPath);
    dirty = false;
    pendingCount = 0;
}

function setOptions({ intervalMs, threshold } = {}) {
    if (typeof intervalMs === 'number' && intervalMs >= 0) flushIntervalMs = intervalMs;
    if (typeof threshold === 'number' && threshold >= 1) flushThreshold = threshold;
}

function closeSync() {
    if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
    }
    flushSync();
}

module.exports = {
    getMap,
    mark,
    flushAsync,
    flushSync,
    setOptions,
    closeSync,
};
const mongoose = require('mongoose');
const redis = require('redis');

const keys = require('../config/keys');

// for localhost no arument is needed
// To connect to a different host or port,
// use a connection string in the format
// redis[s]://[[username][:password]@][host][:port][/db-number]:
// redis.createClient({
//   url: 'redis://alice:foobared@awesome.redis.server:6380',
// });
const client = redis.createClient({ url: keys.redisUrl });
client.on('error', (err) => console.log('Redis Client Error', err));
(async function () {
  await client.connect();
})();

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = {}) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || 'default');
  return this;
};

mongoose.Query.prototype.exec = async function () {
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }

  // returns the query options
  // console.log(this.getQuery());
  // returns collection name (eg. blogs)
  // console.log(this.mongooseCollection.name);

  const key = generateKey(this.getQuery(), this.mongooseCollection.name);

  // do we have any cached data in redis for the request
  const cachedValue = await client.hGet(this.hashKey, key);

  // if yes, respond to request right away
  if (cachedValue) {
    const doc = JSON.parse(cachedValue);
    return Array.isArray(doc)
      ? doc.map((document) => new this.model(document))
      : new this.model(doc);
  }

  // if no, respond to request and update cache
  const result = await exec.apply(this, arguments);
  client.hSet(this.hashKey, key, JSON.stringify(result), 'EX', 10);
  return result;
};

function generateKey(query, collection) {
  const key = Object.assign({}, query, { collection });
  return JSON.stringify(key);
}

function clearHash(hashKey) {
  client.del(JSON.stringify(hashKey));
}

module.exports = {
  clearHash,
};

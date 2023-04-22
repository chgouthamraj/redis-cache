const express = require('express');
const redis = require('redis');
const axios = require('axios');

//redis is a key-value store we need to provide both key and value
const redisUrl = 'redis://127.0.0.1:6379';
//to connect to redis(it return back a client )
///const client = redis.createClient(redisUrl);

let redisClient;
(async () => {
  redisClient = redis.createClient();
  redisClient.on('error', (error) => console.error(`Error : ${error}`));
  await redisClient.connect();
})();

const app = express();
app.use(express.json());

//set data in redis
app.post('/', async (req, res) => {
  const { key, value } = req.body;
  const response = await redisClient.set(key, value);
  res.send(response);
});

//get data in redis
app.get('/', async (req, res) => {
  const { key } = req.body;
  const response = await redisClient.get(key);
  res.send(response);
});

app.get('/posts/:id', async (req, res) => {
  const { id } = req.params;

  const cachedData = await redisClient.get(`posts-${id}`);
  if (cachedData) {
    return res.json(JSON.parse(cachedData));
  }

  const response = await axios.get(
    `https://jsonplaceholder.typicode.com/posts/${id}`
  );
  redisClient.set(`posts-${id}`, JSON.stringify(response.data), {
    EX: 10,
  });
  return res.send(response.data);
});

app.listen(8080, () => {
  console.log('>>>hey now listening on port 8080!!<<<');
});

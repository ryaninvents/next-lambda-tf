import express from 'express';

const server = express();

server.get('/', (req, res) => {
  res.send('<h2>Hello from API!</h2>');
});

export default server;

import React, { useState } from 'react';
import { Button, Flex, Box } from 'rebass';

export default function Interactive ({ initialCount }) {
  const [count, setCount] = useState(initialCount);

  return (
    <Flex flexDirection="row" alignItems="baseline">
      <Button onClick={() => setCount(count - 1)}>-</Button>
      <Box mx={3}>{String(count)}</Box>
      <Button onClick={() => setCount(count + 1)}>+</Button>
    </Flex>
  );
}

Interactive.getInitialProps = function getInitialProps ({ query = {} }) {
  const count = !isNaN(query.count) ? Number(query.count) : 0;
  return { initialCount: count };
};

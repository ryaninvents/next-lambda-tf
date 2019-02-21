import React, { useState } from 'react';

export default function Interactive ({ initialCount }) {
  const [count, setCount] = useState(initialCount);

  return (
    <div>
      <button onClick={() => setCount(count - 1)}>-</button>
      <strong>{String(count)}</strong>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}

Interactive.getInitialProps = function getInitialProps ({ req }) {
  const count = req.query && req.query.count ? Number(req.query.count) : 0;
  return { initialCount: count };
};

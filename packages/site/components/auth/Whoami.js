import React from 'react';
import { usePromise } from 'promise-hook';
import fetch from 'isomorphic-fetch';

// HACK: replace
const AUTH_HOST = document.location.hostname === 'localhost' ? document.location.host : `auth-${document.location.host}`;

async function fetchUser () {
  const resp = await fetch(`https://${AUTH_HOST}/auth/whoami`, { mode: 'cors', credentials: 'include' });
  return resp.json();
}

export default function Whoami () {
  const { isFetching, error, data } = usePromise(fetchUser, { resolve: true });
  if (isFetching) return <div data-host={AUTH_HOST}>Loading...</div>;
  if (error) {
    return <div data-host={AUTH_HOST}>Error: {error.message || JSON.stringify(error)}</div>;
  }
  if (!data || !data.displayName) {
    return (
      <div data-host={AUTH_HOST}>
        <a href={`https://${AUTH_HOST}/auth/google`}>Log in with Google</a>
      </div>
    );
  }
  return (
    <div data-host={AUTH_HOST}>
      Hello, {data.displayName}!
    </div>
  );
}

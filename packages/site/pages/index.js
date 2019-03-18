import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const Whoami = dynamic(() => import('../components/auth/Whoami'), { ssr: false });

export default () => (
  <React.Fragment>
    <p>Sample deployment of Next.js to AWS Lambda.</p>
    <p>Check out the <Link href="/interactive">Counter</Link> interactive example. Perhaps try setting a <Link href="/interactive?count=5">starting value?</Link></p>
    <div>
      <Whoami />
    </div>
  </React.Fragment>
);

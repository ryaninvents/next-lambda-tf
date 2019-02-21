import React from 'react';
import App, { Container } from 'next/app';
import Link from 'next/link';
import styled, { ThemeProvider } from 'styled-components';
import { Heading, Box } from 'rebass';

const DisplayContainer = styled(Box)({ maxWidth: '40em', margin: 'auto' });

export default class MyApp extends App {
  static async getInitialProps ({ Component, ctx, ...rest }) {
    let pageProps = {};

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx);
    }
    return { Component, pageProps, path: String(ctx.asPath || ctx.pathname) };
  }
  render () {
    const { Component, pageProps, path } = this.props;
    return <Container>
      <ThemeProvider theme={{}}>
        <DisplayContainer>
          <Heading is="h1">{path}</Heading>
          <Component {...pageProps} />
          {path !== '/' ? (
            <Box my={3}>
              <Link href="/">
              &larr; Back home
              </Link>
            </Box>
          ) : null}
        </DisplayContainer>
      </ThemeProvider>
    </Container>;
  }
}

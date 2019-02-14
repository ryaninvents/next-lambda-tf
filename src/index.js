import sls from 'serverless-http';
import binaryMimeTypes from './binaryMimeTypes';
import server from './server';

export const handler = sls(server, {
  binary: binaryMimeTypes
});

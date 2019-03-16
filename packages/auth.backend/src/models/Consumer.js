import eyed from 'eyed';
import Dynamo from 'aws-sdk/clients/dynamodb';

import Config from '../config';

const userDb = new Dynamo.DocumentClient({
  params: {
    TableName: Config.tables.users
  }
});
const foreignProfileDb = new Dynamo.DocumentClient({
  params: {
    TableName: Config.tables.foreignProfiles
  }
});

export default class Consumer {
  static generateId () {
    return eyed.uuid();
  }

  static async getById (id) {
    const { Item: data } = await userDb.get({
      Key: { id }
    }).promise();
    return data;
  }

  static async ensureFromForeignProfile (providerName, profile) {
    const maybeExistingUser = await this.getFromForeignId(providerName, profile.id);
    if (maybeExistingUser) {
      return maybeExistingUser;
    }
    const user = await this.createFromForeignProfile(providerName, profile);
    return user;
  }

  static async createFromForeignProfile (providerName, profile) {
    const user = {
      id: this.generateId(),
      displayName: profile.displayName,
      foreignProfiles: [{
        provider: providerName,
        id: profile.id
      }]
    };
    await userDb.put({
      Item: user
    }).promise();
    await foreignProfileDb.put({
      Item: {
        foreignProfileKey: `${providerName}:${profile.id}`,
        userId: user.id
      }
    }).promise();
    return user;
  }

  static async getFromForeignId (providerName, id) {
    const { Item: data } = await foreignProfileDb.get({
      Key: { foreignProfileKey: `${providerName}:${id}` }
    }).promise();
    if (!data) return null;
    const userData = await this.getById(data.userId);
    return userData;
  }
}

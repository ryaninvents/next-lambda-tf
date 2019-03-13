import ProdConsumer from '../Consumer';
import db from './db';

const TABLE_NAME = 'Consumer';

const Indexes = {
  ForeignProvider: 'ForeignProvider'
};

export default class Consumer extends ProdConsumer {
  static async init () {
    await db.createDesignDoc(TABLE_NAME, 'ForeignProvider', {
      views: {
        'Consumer.ForeignProvider': {
          map: `
function map (doc) {
  if (!doc.foreignProfiles || !doc.foreignProfiles.length) {
    return;
  }
  var foreignProfile;
  for (var i = 0; i < doc.foreignProfiles.length; i++) {
    foreignProfile = doc.foreignProfiles[i];
    emit([foreignProfile.provider, foreignProfile.id], doc);
  }
}
`
        }
      }
    });
  }

  static async createFromForeignProfile (providerName, profile) {
    const id = this.generateId();
    const newUser = {
      id,
      displayName: profile.displayName,
      foreignProfiles: [{
        provider: providerName,
        id: profile.id
      }]
    };
    await db.put(TABLE_NAME, id, newUser);
    return newUser;
  }

  static async getFromForeignId (providerName, id) {
    try {
      const { rows: [result] } = await db.query(TABLE_NAME, Indexes.ForeignProvider, {
        key: [providerName, id]
      });
      if (!result) return null;
      return result.value;
    } catch (dbError) {
      if (dbError.name === 'not_found') {
        return null;
      }
      throw dbError;
    }
  }

  static async getById (id) {
    const user = await db.get(TABLE_NAME, id);
    return user;
  }
}

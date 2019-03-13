import PouchDB from 'pouchdb';
import PouchFind from 'pouchdb-find';
import mkdirp from 'mkdirp';
import { resolve } from 'path';

PouchDB.plugin(PouchFind);

const dataPath = resolve(__dirname, '../../../.data/models-storage');
mkdirp.sync(dataPath);

const db = new PouchDB(dataPath);
process.on('exit', () => db.close());

class Database {
  pouch = db;

  async put (table, id, item) {
    await db.put({
      ...item,
      _id: `items/${table}/${id}`,
      id
    });
  }

  async get (table, id) {
    try {
      const item = await db.get(`items/${table}/${id}`);
      return item;
    } catch (err) {
      if (err.name === 'not_found') {
        return null;
      }
      throw err;
    }
  }

  async delete (table, id) {
    const doc = await this.get(table, id);
    await db.remove(doc);
  }

  async createIndex (table, indexName, spec) {
    await db.createIndex(spec);
  }

  async createDesignDoc (table, indexName, doc) {
    const ddId = designDocId(table, indexName);
    let oldDoc = {};
    try {
      oldDoc = await db.get(ddId);
    } catch (err) {

    } finally {
      await db.put({
        ...oldDoc,
        _id: ddId,
        ...doc
      });
    }
  }

  async query (table, indexName, opts) {
    return db.query(`${table}.${indexName}`, opts);
  }
}

function designDocId (table, indexName) {
  console.log({ table, indexName });
  return `_design/${table}.${indexName}`;
}

export default new Database();

import eyed from 'eyed';

export default class Consumer {
  static generateId () {
    return eyed.uuid();
  }

  static async getById (id) {
    return null;
  }

  static async ensureFromForeignProfile (providerName, profile) {
    const maybeExistingUser = await this.getFromForeignId(providerName, profile.id);
    if (maybeExistingUser) {
      return maybeExistingUser;
    }
    const user = await this.createFromForeignProfile(providerName, profile);
    return user;
  }
}

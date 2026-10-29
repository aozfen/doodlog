// Local-only Evolu instance. Sync is off (no transports) until we run our own relay.
import * as Evolu from '@evolu/common';
import { createEvoluDeps, createRun } from '@evolu/react-native';
import * as SecureStore from 'expo-secure-store';

import { Schema } from './schema';

const MNEMONIC_KEY = 'evolu-mnemonic';

/**
 * The local database is keyed by the owner, so the same owner must come back on every launch.
 * Its mnemonic lives in the keychain / keystore.
 */
function loadAppOwner(): Evolu.AppOwner {
  const saved = SecureStore.getItem(MNEMONIC_KEY);
  const mnemonic = saved ? Evolu.Mnemonic.fromUnknown(saved) : null;
  if (mnemonic?.ok) return Evolu.createAppOwner(Evolu.mnemonicToOwnerSecret(mnemonic.value));

  const owner = Evolu.createAppOwner(Evolu.createOwnerSecret({ randomBytes: Evolu.createRandomBytes() }));
  SecureStore.setItem(MNEMONIC_KEY, owner.mnemonic);
  return owner;
}

const run = createRun(createEvoluDeps());

export const evoluPromise = run.ok(
  Evolu.createEvolu(Schema, {
    appName: Evolu.AppName.orThrow('doods'),
    appOwner: loadAppOwner(),
    transports: [],
  }),
);

export type Db = Awaited<typeof evoluPromise>;

const createQuery = Evolu.createQueryBuilder(Schema);

export const notebooksQuery = createQuery((db) =>
  db
    .selectFrom('notebook')
    .selectAll()
    .where('isDeleted', 'is not', Evolu.sqliteTrue)
    .orderBy('createdOn')
    .orderBy('createdAt'),
);

export const memoriesQuery = createQuery((db) =>
  db
    .selectFrom('memory')
    .selectAll()
    .where('isDeleted', 'is not', Evolu.sqliteTrue)
    .orderBy('date')
    .orderBy('createdAt'),
);

/** Developer recovery: soft-deleted notebooks and memories. */
export const deletedNotebooksQuery = createQuery((db) =>
  db.selectFrom('notebook').selectAll().where('isDeleted', 'is', Evolu.sqliteTrue),
);
export const deletedMemoriesQuery = createQuery((db) =>
  db.selectFrom('memory').selectAll().where('isDeleted', 'is', Evolu.sqliteTrue),
);

export const profileQuery = createQuery((db) =>
  db.selectFrom('profile').selectAll().where('isDeleted', 'is not', Evolu.sqliteTrue).limit(1),
);

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { nativeDraftCreation } from '../apps/backend/src/middleware.ts';

test('missing draft artwork survives legacy EmDash NOT NULL image columns', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec("CREATE TABLE artist (title TEXT NOT NULL DEFAULT '', image TEXT NOT NULL DEFAULT '')");
    assert.throws(() => db.prepare('INSERT INTO artist (title,image) VALUES (?,?)').run('', null), /NOT NULL/);
    const command = { slug: 'new-artist', data: { title: '', image: null, bio: '' } };
    const native = nativeDraftCreation('artists', command);
    assert.deepEqual(native.data, { title: '', bio: '' });
    db.prepare('INSERT INTO artist (title) VALUES (?)').run(native.data.title);
    assert.equal(db.prepare('SELECT image FROM artist').get().image, '');
    assert.equal(command.data.image, null, 'The draft value remains available for the revision');
    for (const [collection, field] of [
      ['news', 'image'],
      ['distro', 'image'],
      ['releases', 'cover_image'],
    ]) {
      assert.deepEqual(nativeDraftCreation(collection, { data: { [field]: null, title: 'Draft' } }).data, {
        title: 'Draft',
      });
      const selected = { data: { [field]: { id: 'photo' }, title: 'Draft' } };
      assert.equal(nativeDraftCreation(collection, selected), selected);
    }
  } finally {
    db.close();
  }
});

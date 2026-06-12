/**
 * Lightweight in-memory mock of the Firebase Admin Firestore surface used by the
 * Netlify functions (netlify/functions/*). It is deliberately NOT a full emulator —
 * it supports exactly the access patterns those handlers use:
 *   db.collection(name) / db.doc(path)
 *   collectionRef.doc(id) / .where(field, op, value) / .get() / .add(data) / .count().get()
 *   docRef.get() / .set(data, { merge }) / .update(data) / .delete() / .collection(name)
 *   FieldValue.serverTimestamp / arrayUnion / arrayRemove / increment
 *   FieldPath.documentId()
 *
 * Documents are stored by full slash-delimited path. arrayUnion/arrayRemove are applied
 * eagerly on write so later reads in the same handler observe the reconciled value —
 * which is what the multi-step authorization/reconciliation logic depends on.
 *
 * Lives under src/test-utils (NOT __tests__) so CRA's testMatch does not run it as a suite.
 */

const ARRAY_UNION = 'arrayUnion';
const ARRAY_REMOVE = 'arrayRemove';
const INCREMENT = 'increment';
const SERVER_TIMESTAMP = 'serverTimestamp';
const DOCUMENT_ID = '__documentId__';

const FieldValue = {
  serverTimestamp: () => ({ __op: SERVER_TIMESTAMP }),
  arrayUnion: (...vals) => ({ __op: ARRAY_UNION, vals }),
  arrayRemove: (...vals) => ({ __op: ARRAY_REMOVE, vals }),
  increment: (n) => ({ __op: INCREMENT, n }),
};

const FieldPath = {
  documentId: () => ({ __fieldPath: DOCUMENT_ID }),
};

const isDirectChild = (docPath, collectionPath) => {
  const prefix = `${collectionPath}/`;
  if (!docPath.startsWith(prefix)) return null;
  const rest = docPath.slice(prefix.length);
  return rest.includes('/') ? null : rest;
};

export function createAdminMock(initialDocs = {}) {
  const store = new Map(Object.entries(initialDocs));
  const sets = [];
  const updates = [];
  const adds = [];
  const deletes = [];
  let addCounter = 0;

  const applyData = (path, data, merge) => {
    const base = merge ? { ...(store.get(path) || {}) } : {};
    for (const [key, value] of Object.entries(data)) {
      if (value && value.__op === ARRAY_UNION) {
        const cur = Array.isArray(base[key]) ? base[key] : [];
        base[key] = Array.from(new Set([...cur, ...value.vals]));
      } else if (value && value.__op === ARRAY_REMOVE) {
        const cur = Array.isArray(base[key]) ? base[key] : [];
        base[key] = cur.filter((x) => !value.vals.includes(x));
      } else if (value && value.__op === INCREMENT) {
        base[key] = (typeof base[key] === 'number' ? base[key] : 0) + value.n;
      } else {
        base[key] = value;
      }
    }
    store.set(path, base);
  };

  const docRef = (path) => ({
    path,
    id: path.split('/').pop(),
    get: async () => {
      const data = store.get(path);
      return {
        exists: data !== undefined,
        id: path.split('/').pop(),
        data: () => data,
        ref: { path },
      };
    },
    set: async (data, options) => { sets.push({ path, data, options }); applyData(path, data, Boolean(options && options.merge)); },
    update: async (data) => { updates.push({ path, data }); applyData(path, data, true); },
    delete: async () => { deletes.push({ path }); store.delete(path); },
    collection: (name) => collRef(`${path}/${name}`),
  });

  function collRef(path, filters = []) {
    const matchDoc = (id, data) => filters.every((f) => {
      const fieldVal = f.field && f.field.__fieldPath === DOCUMENT_ID ? id : data[f.field];
      if (f.op === '==') return fieldVal === f.value;
      if (f.op === 'in') return Array.isArray(f.value) && f.value.includes(fieldVal);
      if (f.op === 'array-contains') return Array.isArray(fieldVal) && fieldVal.includes(f.value);
      return true;
    });

    const queryDocs = () => {
      const results = [];
      for (const [docPath, data] of store.entries()) {
        if (data === undefined) continue;
        const id = isDirectChild(docPath, path);
        if (id === null) continue;
        if (matchDoc(id, data)) {
          results.push({ id, data: () => data, ref: docRef(docPath) });
        }
      }
      return results;
    };

    return {
      path,
      doc: (id) => docRef(`${path}/${id}`),
      where: (field, op, value) => collRef(path, [...filters, { field, op, value }]),
      add: async (data) => {
        addCounter += 1;
        const id = `auto-${addCounter}`;
        const childPath = `${path}/${id}`;
        adds.push({ path: childPath, data });
        applyData(childPath, data, false);
        return { id, path: childPath };
      },
      count: () => ({ get: async () => ({ data: () => ({ count: queryDocs().length }) }) }),
      get: async () => {
        const docs = queryDocs();
        return { docs, empty: docs.length === 0, forEach: (cb) => docs.forEach(cb) };
      },
    };
  }

  const batch = () => {
    const ops = [];
    return {
      set: (ref, data, options) => { ops.push(['set', ref.path, data, options]); },
      update: (ref, data) => { ops.push(['update', ref.path, data]); },
      delete: (ref) => { ops.push(['delete', ref.path]); },
      commit: async () => {
        for (const [op, path, data, options] of ops) {
          if (op === 'delete') { deletes.push({ path }); store.delete(path); }
          else if (op === 'update') { updates.push({ path, data }); applyData(path, data, true); }
          else { sets.push({ path, data, options }); applyData(path, data, Boolean(options && options.merge)); }
        }
      },
    };
  };

  const db = {
    collection: (name) => collRef(name),
    doc: (path) => docRef(path),
    batch,
  };

  return { db, FieldValue, FieldPath, store, sets, updates, adds, deletes };
}

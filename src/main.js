import { makePersistedAdapter } from '@livestore/adapter-web'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
import { createStorePromise, makeSchema, queryDb, Schema, SessionIdSymbol, State } from '@livestore/livestore'

import LiveStoreWorker from './livestore.worker.js?worker'

const uiState = State.SQLite.clientDocument({
  name: 'uiState',
  schema: Schema.Struct({ draft: Schema.String }),
  default: {
    id: SessionIdSymbol,
    value: { draft: '' },
  },
})

const events = {
  uiStateSet: uiState.set,
}

const state = State.SQLite.makeState({
  tables: { uiState },
  materializers: State.SQLite.materializers(events, {}),
})

const schema = makeSchema({ events, state })

const adapter = makePersistedAdapter({
  storage: { type: 'opfs' },
  worker: LiveStoreWorker,
  sharedWorker: LiveStoreSharedWorker,
})

const input = document.querySelector('#draft')
const status = document.querySelector('#status')

try {
  const store = await createStorePromise({
    schema,
    adapter,
    storeId: 'repro-commit-durability-reload-race',
  })

  const uiState$ = queryDb(uiState.get())

  store.subscribe(uiState$, {
    onUpdate(value) {
      input.value = value.draft
      status.textContent = `draft-bytes=${value.draft.length}`
    },
  })

  input.addEventListener('input', (event) => {
    const target = /** @type {HTMLInputElement} */ (event.target)
    store.commit(events.uiStateSet({ draft: target.value }))
  })

  window.__repro = {
    setDraftBurst({ count, payloadSize, token }) {
      const chunk = 'x'.repeat(payloadSize)
      let last = ''
      for (let i = 0; i < count; i += 1) {
        last = `${token}-${i}-${chunk}`
        store.commit(events.uiStateSet({ draft: last }))
      }
      return last
    },
    getDraft() {
      return store.query(uiState$).draft
    },
  }
} catch (error) {
  status.textContent = String(error)
  window.__reproError = String(error)
}

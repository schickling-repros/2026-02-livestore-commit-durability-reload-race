import { makeWorker } from '@livestore/adapter-web/worker'
import { makeSchema, Schema, SessionIdSymbol, State } from '@livestore/livestore'

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

makeWorker({ schema })

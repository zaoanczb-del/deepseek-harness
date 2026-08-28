import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { clientBundle } from '../../client/tsdown.client.ts'

const RAW_QUERY = '?raw'
const VIRTUAL_SUFFIX = '?dsh-authoring-csv-raw'
const TYPES_MARKER = `${sep}lib${sep}types${sep}`

/** Resolve the package CSV from source or emitted Client TypeScript imports. */
function sourceCsvPath(importer: string, source: string): string {
  const markerIndex = importer.indexOf(TYPES_MARKER)
  const sourceImporter = markerIndex === -1
    ? importer
    : `${importer.slice(0, markerIndex)}${sep}src${sep}${importer.slice(markerIndex + TYPES_MARKER.length)}`
  return resolve(dirname(sourceImporter), source.slice(0, -RAW_QUERY.length))
}

/** Inline the authoring CSV into the browser bundle while keeping the CSV as source of truth. */
function authoringCsvPlugin() {
  return {
    name: 'dsh-authoring-csv-raw',
    resolveId(source: string, importer: string | undefined) {
      if (importer === undefined || !source.endsWith(`ezhishi_words.csv${RAW_QUERY}`)) return null
      const file = sourceCsvPath(importer, source)
      if (!existsSync(file)) throw new Error(`authoring: CSV not found at ${file}`)
      return `${file}${VIRTUAL_SUFFIX}`
    },
    async load(id: string) {
      if (!id.endsWith(VIRTUAL_SUFFIX)) return null
      const file = id.slice(0, -VIRTUAL_SUFFIX.length)
      return `export default ${JSON.stringify(await readFile(file, 'utf8'))}`
    },
  }
}

export default clientBundle(
  '@deepseek-ai/dsh-client-ui-authoring',
  ['lib/types/index.js', 'lib/types/invariant.js'],
  { clientPlugins: [authoringCsvPlugin()] },
)

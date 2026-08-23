/**
 * Carga lib/emails/layout.ts desde un script de Node, compilándolo en caliente.
 *
 * Existe para que los scripts usen EXACTAMENTE el mismo diseño que la app en vez
 * de una copia: si el mail de prueba no se ve igual que los de verdad, no está
 * probando nada.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'

export async function cargarLayout() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..')
  const temp = join(tmpdir(), `coleswap-layout-${Date.now()}`)
  mkdirSync(temp, { recursive: true })

  // Se invoca el tsc de node_modules con node: npx.cmd no arranca desde
  // execFileSync en Windows, y así tampoco depende del PATH.
  execFileSync(
    process.execPath,
    [
      join(root, 'node_modules', 'typescript', 'bin', 'tsc'),
      'lib/emails/layout.ts',
      '--outDir', temp,
      '--module', 'esnext',
      '--target', 'es2022',
      // Sin esto tsc carga @types/node entero y falla por dependencias suyas
      // que no hacen falta: layout.ts no usa ninguna API de Node.
      '--typeRoots', temp,
      '--skipLibCheck',
    ],
    { cwd: root, stdio: 'pipe' }
  )

  const mod = await import(pathToFileURL(join(temp, 'layout.js')).href)
  rmSync(temp, { recursive: true, force: true })
  return mod
}

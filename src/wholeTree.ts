// The Viz class type isn't exported by @viz-js/viz, so we infer it from instance()'s return type.
type Viz = Awaited<ReturnType<typeof import('@viz-js/viz').instance>>

let vizInstance: Viz | null = null

function personLabel(p: any): string {
  const name = [p.data['first name'], p.data['last name']].filter(Boolean).join(' ') || p.id
  const years = [p.data.born, p.data.died].filter(Boolean).join(' – ')
  const label = years ? `${name}\n${years}` : name
  return label.replace(/"/g, '\\"')
}

function nodeColor(p: any): string {
  if (p.data.gender === 'M') return '#3b5b8c'
  if (p.data.gender === 'F') return '#8c3b6b'
  return '#555555'
}

function buildDot(data: any[]): string {
  const byId = new Map(data.map((p) => [p.id, p]))
  const lines: string[] = [
    'digraph FamilyTree {',
    'bgcolor="transparent";',
    'rankdir=TB;',
    'node [shape=box, style="rounded,filled", fontname="Helvetica", fontsize=11, fontcolor="#ffffff"];',
    'edge [color="#888888"];',
  ]

  for (const p of data) {
    lines.push(`"${p.id}" [label="${personLabel(p)}", fillcolor="${nodeColor(p)}"];`)
  }

  for (const p of data) {
    for (const parentId of p.rels?.parents || []) {
      if (byId.has(parentId)) {
        lines.push(`"${parentId}" -> "${p.id}" [dir=none];`)
      }
    }
  }

  const seenSpousePairs = new Set<string>()
  for (const p of data) {
    for (const spouseId of p.rels?.spouses || []) {
      if (!byId.has(spouseId)) continue
      const pairKey = [p.id, spouseId].sort().join('::')
      if (seenSpousePairs.has(pairKey)) continue
      seenSpousePairs.add(pairKey)
      lines.push(`"${p.id}" -> "${spouseId}" [dir=none, style=dashed, constraint=false];`)
    }
  }

  lines.push('}')
  return lines.join('\n')
}

export async function showWholeTree(data: any[]) {
  const overlay = document.createElement('div')
  overlay.id = 'whole-tree-overlay'
  overlay.innerHTML = `
    <div id="whole-tree-panel">
      <button id="whole-tree-close">✕</button>
      <div id="whole-tree-scroll"><p id="whole-tree-status">Rendering…</p></div>
    </div>
  `
  document.body.appendChild(overlay)

  const close = () => overlay.remove()
  overlay.querySelector('#whole-tree-close')!.addEventListener('click', close)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close()
  })

  if (!vizInstance) {
    const { instance } = await import('@viz-js/viz')
    vizInstance = await instance()
  }

  const svg = vizInstance.renderSVGElement(buildDot(data))
  const scroll = overlay.querySelector('#whole-tree-scroll')!
  scroll.innerHTML = ''
  scroll.appendChild(svg)
}

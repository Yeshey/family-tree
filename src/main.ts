import * as f3 from 'family-chart'
import 'family-chart/styles/family-chart.css'
import { getLang, setLang, t, type Lang } from './i18n'

let f3Chart: any = null
let f3Card: any = null
let showingEntireTree = false
let lastClickedId: string | null = null
let originalData: any[] = []

const ROOT_ID_FOR_ENTIRE_TREE = 'joao_filipe'
const VIRTUAL_ROOT_ID = '__root__'

async function main() {
  const res = await fetch(`${import.meta.env.BASE_URL}data.json`)
  originalData = await res.json()

  await buildChart('related')

  setupThemeToggle()
  setupPanelClose()
  setupEntireTreeToggle()
}

function prepareEntireTreeData(): any[] {
  const data: any[] = JSON.parse(JSON.stringify(originalData))
  const personMap = new Map(data.map((p: any) => [p.id, p]))

  for (const pid of ['jose_marques', 'maria_rodrigues_cro']) {
    const p = personMap.get(pid)
    if (p?.rels?.children) {
      p.rels.children = p.rels.children.filter((c: string) => c !== 'cidalia')
    }
  }

  const processed = new Set<string>()
  for (const person of data) {
    if (processed.has(person.id)) continue
    if (!person.rels?.spouses || !person.rels?.children) {
      processed.add(person.id)
      continue
    }
    for (const spouseId of person.rels.spouses) {
      if (processed.has(spouseId)) continue
      const spouse = personMap.get(spouseId)
      if (spouse?.rels?.children && spouse.rels.children.length > 0) {
        spouse.rels.children = spouse.rels.children.filter(
          (c: string) => !person.rels.children.includes(c)
        )
      }
      processed.add(spouseId)
    }
    processed.add(person.id)
  }

  const virtualRoot = {
    id: VIRTUAL_ROOT_ID,
    data: { 'first name': 'Family', 'last name': 'Tree', gender: 'M' },
    rels: { children: ['jose_silva_pai', 'jose_marques'] },
  }
  for (const person of data) {
    if (person.id === 'jose_silva_pai' || person.id === 'jose_marques') {
      if (!person.rels) person.rels = {}
      if (!person.rels.parents) person.rels.parents = []
      if (!person.rels.parents.includes(VIRTUAL_ROOT_ID)) {
        person.rels.parents.push(VIRTUAL_ROOT_ID)
      }
    }
  }
  data.push(virtualRoot)

  return data
}

async function buildChart(mode: 'entire' | 'related', mainId?: string) {
  const cont = document.getElementById('FamilyChart')!
  cont.innerHTML = ''

  let data: any[]
  let effectiveMainId: string

  if (mode === 'entire') {
    data = prepareEntireTreeData()
    effectiveMainId = VIRTUAL_ROOT_ID
  } else {
    data = originalData
    effectiveMainId = mainId || lastClickedId || ROOT_ID_FOR_ENTIRE_TREE
  }

  f3Chart = f3.createChart('#FamilyChart', data)

  if (typeof f3Chart.setSingleParentEmptyCard === 'function') {
    f3Chart.setSingleParentEmptyCard(false)
  }

  f3Card = f3Chart.setCardHtml()
    .setCardDisplay([['first name', 'last name'], ['born']])
    .setStyle('imageRect')
    .setMiniTree(true)
    .setOnHoverPathToMain()

  f3Card.setOnCardClick((e: MouseEvent, d: any) => {
    if (!showingEntireTree) {
      f3Card.onCardClickDefault(e, d)
    }
    lastClickedId = d.data.id
    showDetails(d.data.data)
  })

  setMainPerson(effectiveMainId)
  f3Chart.updateTree({ initial: true, tree_position: 'fit' })

  if (mode === 'entire') {
    requestAnimationFrame(() => hideVirtualRootAndBadges(cont))
    setTimeout(() => hideVirtualRootAndBadges(cont), 50)
    setTimeout(() => hideVirtualRootAndBadges(cont), 200)
  }

  setupSearch()
}

function hideVirtualRootAndBadges(cont: HTMLElement) {
  const hide = (el: Element) => {
    const s = el.getAttribute('style') || ''
    if (!s.includes('display:none')) {
      el.setAttribute(
        'style',
        s + ';display:none !important;opacity:0 !important;pointer-events:none !important;'
      )
    }
  }

  cont
    .querySelectorAll(`[data-d="${VIRTUAL_ROOT_ID}"], [data-id="${VIRTUAL_ROOT_ID}"]`)
    .forEach(hide)

  cont.querySelectorAll('text').forEach((t) => {
    const txt = (t.textContent || '').trim()
    if (txt === 'Family Tree' || txt === 'Family' || txt === 'Tree') {
      let g: Element | null = t
      while (g && g.tagName.toLowerCase() !== 'g') g = g.parentElement
      if (g) hide(g)
    }
  })

  cont.querySelectorAll('*').forEach((el) => {
    for (let i = 0; i < el.attributes.length; i++) {
      if (el.attributes[i].value.includes(VIRTUAL_ROOT_ID)) {
        hide(el)
        break
      }
    }
  })

  const rootEl = cont.querySelector(
    `[data-d="${VIRTUAL_ROOT_ID}"], [data-id="${VIRTUAL_ROOT_ID}"]`
  ) as Element | null

  let rootX: number | null = null
  let rootY: number | null = null

  if (rootEl) {
    const transform = rootEl.getAttribute('transform') || ''
    const m = transform.match(/translate\(\s*([^,\s]+)[\s,]+([^)]+)\)/)
    if (m) {
      rootX = parseFloat(m[1])
      rootY = parseFloat(m[2])
    }
  }

  if (rootX !== null && rootY !== null) {
    cont.querySelectorAll('path').forEach((el) => {
      if ((el.getAttribute('style') || '').includes('display:none')) return
      const d = el.getAttribute('d') || ''
      const coords = d.match(/[-+]?\d*\.?\d+/g)
      if (coords && coords.length >= 4) {
        const startX = parseFloat(coords[0])
        const startY = parseFloat(coords[1])
        const endX = parseFloat(coords[coords.length - 2])
        const endY = parseFloat(coords[coords.length - 1])
        const distStart = Math.hypot(startX - rootX!, startY - rootY!)
        const distEnd = Math.hypot(endX - rootX!, endY - rootY!)
        if (distStart < 60 || distEnd < 60) {
          hide(el)
        }
      }
    })
  }

  cont.querySelectorAll('text').forEach((t) => {
    const txt = (t.textContent || '').trim().toLowerCase()
    if (txt.length <= 3 && (txt === 'x2' || txt === '×2' || /^\d+$/.test(txt))) {
      hide(t)
    }
  })
}

function setMainPerson(id: string): boolean {
  const methodNames = ['setMain', 'setMainId', 'setMainPerson', 'updateMainId']
  for (const m of methodNames) {
    if (typeof f3Chart[m] === 'function') {
      try { f3Chart[m](id); return true } catch {}
    }
  }
  const store = f3Chart.store || f3Chart._store
  if (store) {
    for (const m of methodNames) {
      if (typeof store[m] === 'function') {
        try { store[m](id); return true } catch {}
      }
    }
  }
  const state = f3Chart.state || (store && store.state)
  if (state) {
    try { state.main_id = id; return true } catch {}
  }
  return false
}

function showDetails(fields: Record<string, string>) {
  const lang = getLang()
  const content = document.getElementById('detail-content')!
  const panel = document.getElementById('detail-panel')!
  const name = [fields['first name'], fields['last name']].filter(Boolean).join(' ')
  const rows = ['born', 'died', 'job', 'notes']
    .filter((key) => fields[key])
    .map((key) => `<dt>${t(key, lang)}</dt><dd>${fields[key]}</dd>`)
    .join('')
  content.innerHTML = `<h2>${name}</h2>${rows}`
  panel.classList.remove('hidden')
}

function setupPanelClose() {
  document.getElementById('detail-close')!.addEventListener('click', () => {
    document.getElementById('detail-panel')!.classList.add('hidden')
  })
}

function setupThemeToggle() {
  const cont = document.getElementById('FamilyChart')!
  const btn = document.getElementById('theme-toggle')!
  const stored = localStorage.getItem('theme')
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
  if (stored === 'light' || (!stored && prefersLight)) {
    cont.classList.add('light-theme')
  }
  btn.addEventListener('click', () => {
    cont.classList.toggle('light-theme')
    localStorage.setItem('theme', cont.classList.contains('light-theme') ? 'light' : 'dark')
  })
}

function setupSearch() {
  const toolbar = document.getElementById('toolbar')!
  const existing = document.getElementById('search-cont')
  if (existing) existing.remove()
  const searchCont = document.createElement('div')
  searchCont.id = 'search-cont'
  toolbar.appendChild(searchCont)

  f3Chart.setPersonDropdown(
    (d: any) => {
      const id = d?.data?.id || d?.id
      if (id === VIRTUAL_ROOT_ID) return ''
      return [d.data['first name'], d.data['last name']].filter(Boolean).join(' ')
    },
    {
      cont: searchCont,
      placeholder: 'Search person…',
      editable: false,
      showEdit: false,
    } as any,
  )
}

let entireTreeBtn: HTMLButtonElement | null = null
function refreshEntireTreeButton() {
  if (entireTreeBtn) {
    entireTreeBtn.textContent = showingEntireTree ? 'Show Related Only' : 'Show Entire Tree'
  }
}

function setupEntireTreeToggle() {
  const toolbar = document.getElementById('toolbar')!
  const btn = document.createElement('button')
  btn.id = 'entire-tree-toggle'
  entireTreeBtn = btn
  refreshEntireTreeButton()

  btn.addEventListener('click', async () => {
    showingEntireTree = !showingEntireTree
    if (showingEntireTree) {
      await buildChart('entire')
    } else {
      await buildChart('related', lastClickedId || ROOT_ID_FOR_ENTIRE_TREE)
    }
    refreshEntireTreeButton()
  })

  toolbar.appendChild(btn)
}

main()
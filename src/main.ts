import * as f3 from 'family-chart'
import 'family-chart/styles/family-chart.css'
import { getLang, t } from './i18n'
import { showWholeTree } from './wholeTree'

let f3Chart: any = null
let f3Card: any = null
let familyData: any[] = []

const ROOT_ID = 'joao_filipe'

async function main() {
  const res = await fetch(`${import.meta.env.BASE_URL}data.json`)
  familyData = await res.json()

  f3Chart = f3.createChart('#FamilyChart', familyData)

  f3Card = f3Chart.setCardHtml()
    .setCardDisplay([['first name', 'last name'], ['born']])
    .setStyle('imageRect')
    .setMiniTree(true)
    .setOnHoverPathToMain()

  f3Card.setOnCardClick((e: MouseEvent, d: any) => {
    f3Card.onCardClickDefault(e, d)
    showDetails(d.data.data)
  })

  setMainPerson(ROOT_ID)
  f3Chart.updateTree({ initial: true, tree_position: 'fit' })

  setupSearch()
  setupThemeToggle()
  setupPanelClose()
  setupWholeTreeButton()
}

// family-chart's API for setting the main/focus person isn't consistent
// across versions, so try the known method names in order.
function setMainPerson(id: string) {
  const methodNames = ['setMain', 'setMainId', 'setMainPerson', 'updateMainId']
  for (const m of methodNames) {
    if (typeof f3Chart[m] === 'function') {
      try { f3Chart[m](id); return } catch {}
    }
  }
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
  const searchCont = document.createElement('div')
  searchCont.id = 'search-cont'
  toolbar.appendChild(searchCont)

  f3Chart.setPersonDropdown(
    (d: any) => [d.data['first name'], d.data['last name']].filter(Boolean).join(' '),
    {
      cont: searchCont,
      placeholder: 'Search person…',
      editable: false,
      showEdit: false,
    } as any,
  )
}

function setupWholeTreeButton() {
  const toolbar = document.getElementById('toolbar')!
  const btn = document.createElement('button')
  btn.id = 'whole-tree-toggle'
  btn.textContent = 'Whole Tree'
  btn.addEventListener('click', () => showWholeTree(familyData))
  toolbar.appendChild(btn)
}

main()

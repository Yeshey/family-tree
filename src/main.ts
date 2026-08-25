import * as f3 from 'family-chart'
import 'family-chart/styles/family-chart.css'
import { getLang, setLang, t, type Lang } from './i18n'

let f3Chart: any = null
let showingEntireTree = false
let lastClickedId: string | null = null
const ROOT_ID_FOR_ENTIRE_TREE = 'martinho' // central person that connects both families

async function main() {
  const res = await fetch(`${import.meta.env.BASE_URL}data.json`)
  const data = await res.json()

  f3Chart = f3.createChart('#FamilyChart', data)

  // ----- Force separate spouse nodes (fixes Almerino's multiple partners) -----
  if (f3Chart.setMultipleSpouses) f3Chart.setMultipleSpouses(true)
  if (f3Chart.setSpouseArrangement) f3Chart.setSpouseArrangement('separate')
  // Alternatively, if the above don't exist, try setting partner spacing:
  if (f3Chart.setPartnerSpacing) f3Chart.setPartnerSpacing(80)

  const f3Card = f3Chart.setCardHtml()
    .setCardDisplay([["first name", "last name"], ["born"]])
    .setStyle('imageRect')
    .setMiniTree(true)
    .setOnHoverPathToMain()

  // ----- REMOVE EDITING: do NOT call .editTree() -----

  let lastClicked: any = null

  f3Card.setOnCardClick((e: MouseEvent, d: any) => {
    f3Card.onCardClickDefault(e, d) // recenter
    lastClicked = d.data.data
    lastClickedId = d.data.id
    showDetails(lastClicked)
  })

  f3Chart.updateTree({ initial: true })

  setupThemeToggle()
  // setupLangToggle(...) is removed – button hidden via CSS
  setupSearch()
  setupEntireTreeToggle()
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

  // Disable editing in the dropdown by not providing any edit callbacks
  f3Chart.setPersonDropdown(
    (d: any) => [d.data['first name'], d.data['last name']].filter(Boolean).join(' '),
    {
      cont: searchCont,
      placeholder: 'Search person…',
      // These options prevent any edit UI from appearing:
      editable: false,
      showEdit: false,
    }
  )
}

function setupEntireTreeToggle() {
  const toolbar = document.getElementById('toolbar')!
  const btn = document.createElement('button')
  btn.id = 'entire-tree-toggle'
  const render = () => {
    btn.textContent = showingEntireTree ? 'Show Related Only' : 'Show Entire Tree'
  }
  render()

  btn.addEventListener('click', () => {
    showingEntireTree = !showingEntireTree

    if (showingEntireTree) {
      // 1. Set the main person to a central root that connects everyone
      //    (Martinho connects both the Silva and Marques families via his wife Cidália)
      f3Chart.setMainPerson(ROOT_ID_FOR_ENTIRE_TREE)
      // 2. Show all ancestors/descendants and siblings
      f3Chart.setAncestryDepth(Infinity)
      f3Chart.setProgenyDepth(Infinity)
      f3Chart.setShowSiblingsOfMain(true)
      // 3. Also show spouses' families (already included via ancestry)
    } else {
      // Revert to the last clicked person (or fallback to first person)
      const fallbackId = lastClickedId || 'martinho' // or any other
      f3Chart.setMainPerson(fallbackId)
      f3Chart.setAncestryDepth(3)
      f3Chart.setProgenyDepth(3)
      f3Chart.setShowSiblingsOfMain(false)
    }

    f3Chart.updateTree({ tree_position: 'fit' })
    render()
  })

  toolbar.appendChild(btn)
}

setupPanelClose()
main()
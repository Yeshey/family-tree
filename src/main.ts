import * as f3 from 'family-chart'
import 'family-chart/styles/family-chart.css'

async function main() {
  const res = await fetch(`${import.meta.env.BASE_URL}data.json`)
  const data = await res.json()

  const f3Chart = f3.createChart('#FamilyChart', data)

  const f3Card = f3Chart.setCardHtml()
    .setCardDisplay([["first name", "last name"], ["birthday"]])
    .setStyle('imageRect')
    .setMiniTree(true)
    .setOnHoverPathToMain()

  const f3EditTree = f3Chart.editTree()
    .setFields(["first name", "last name", "birthday", "job", "notes"])

  f3Card.setOnCardClick((e: MouseEvent, d: any) => {
    f3Card.onCardClickDefault(e, d) // keep default recenter behavior
    showDetails(d.data.data)
  })

  f3Chart.updateTree({ initial: true })

  setupThemeToggle()
  setupPanelClose()
}

function showDetails(fields: Record<string, string>) {
  const content = document.getElementById('detail-content')!
  const panel = document.getElementById('detail-panel')!

  content.innerHTML = Object.entries(fields)
    .filter(([key]) => key !== 'gender' && key !== 'avatar')
    .map(([key, value]) => `<dt>${key}</dt><dd>${value}</dd>`)
    .join('')

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

main()
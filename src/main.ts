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
    .setFields(["first name", "last name", "birthday"])

  f3Chart.updateTree({ initial: true })

  setupThemeToggle()
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
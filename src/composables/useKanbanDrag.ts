const BODY_CLASS = 'kanban-dnd-active'

export function beginKanbanDrag() {
  document.body.classList.add(BODY_CLASS)
  document.addEventListener('selectstart', preventSelect, true)
}

export function endKanbanDrag() {
  document.body.classList.remove(BODY_CLASS)
  document.removeEventListener('selectstart', preventSelect, true)
  window.getSelection()?.removeAllRanges()
}

function preventSelect(e: Event) {
  e.preventDefault()
}

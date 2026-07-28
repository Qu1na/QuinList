import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBoardDriveStore = defineStore('boardDrive', () => {
  const showPanel = ref(false)

  function openPanel() {
    showPanel.value = true
  }

  function closePanel() {
    showPanel.value = false
  }

  function togglePanel() {
    showPanel.value = !showPanel.value
  }

  return {
    showPanel,
    openPanel,
    closePanel,
    togglePanel,
  }
})

export const useShowScreen = () => {
  const showScreen = ref<boolean>(false)

  function openScreen() {
    showScreen.value = true
  }

  function closeScreen() {
    showScreen.value = false
  }

  return { showScreen, openScreen, closeScreen }
}
export function useStorage() {
  function getStorage<T>(key: string): Promise<T | undefined> {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => {
        resolve(result[key] as T | undefined)
      })
    })
  }

  function setStorage(key: string, value: string): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve)
    })
  }

  function removeStorage(key: string): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.remove(key, resolve)
    })
  }

  function updateStorage(key: string, value: unknown): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve)
    })
  }

  return { getStorage, setStorage, removeStorage, updateStorage }
}

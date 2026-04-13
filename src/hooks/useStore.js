import { useState, useEffect, useCallback } from 'react'
import { defaultData } from '../data/defaults'

const STORAGE_KEY = 'prompt_gallery_v1'

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return defaultData
}

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

export function useStore() {
  const [data, setData] = useState(loadData)

  useEffect(() => { saveData(data) }, [data])

  const uid = () => Math.random().toString(36).slice(2, 9)

  const addCategory = useCallback((name, icon) => {
    setData(d => ({ ...d, categories: [...d.categories, { id: 'c' + uid(), name, icon: icon || '📁' }] }))
  }, [])

  const deleteCategory = useCallback((id) => {
    setData(d => ({
      ...d,
      categories: d.categories.filter(c => c.id !== id),
      subcategories: d.subcategories.filter(s => s.catId !== id),
      prompts: d.prompts.filter(p => p.catId !== id),
    }))
  }, [])

  const addSubcategory = useCallback((catId, name) => {
    setData(d => ({ ...d, subcategories: [...d.subcategories, { id: 's' + uid(), catId, name }] }))
  }, [])

  const deleteSubcategory = useCallback((id) => {
    setData(d => ({
      ...d,
      subcategories: d.subcategories.filter(s => s.id !== id),
      prompts: d.prompts.map(p => p.subId === id ? { ...p, subId: null } : p),
    }))
  }, [])

  const addPrompt = useCallback((prompt) => {
    setData(d => ({ ...d, prompts: [...d.prompts, { id: 'p' + uid(), img: null, ...prompt }] }))
  }, [])

  const updatePrompt = useCallback((id, fields) => {
    setData(d => ({ ...d, prompts: d.prompts.map(p => p.id === id ? { ...p, ...fields } : p) }))
  }, [])

  const deletePrompt = useCallback((id) => {
    setData(d => ({ ...d, prompts: d.prompts.filter(p => p.id !== id) }))
  }, [])

  const setPromptImage = useCallback((id, img) => {
    setData(d => ({ ...d, prompts: d.prompts.map(p => p.id === id ? { ...p, img } : p) }))
  }, [])

  return {
    data,
    addCategory, deleteCategory,
    addSubcategory, deleteSubcategory,
    addPrompt, updatePrompt, deletePrompt,
    setPromptImage,
  }
}

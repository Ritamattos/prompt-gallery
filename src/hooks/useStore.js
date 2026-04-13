import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const mapCat    = r => ({ id: r.id, name: r.name, icon: r.icon })
const mapSub    = r => ({ id: r.id, catId: r.cat_id, name: r.name })
const mapPrompt = r => ({
  id: r.id, catId: r.cat_id, subId: r.sub_id,
  name: r.name, text: r.text, img: r.img, aspect: r.aspect || '1:1',
})

const EMPTY = { categories: [], subcategories: [], prompts: [] }

export function useStore(userId) {
  const [data, setData]       = useState(EMPTY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    loadAll()
  }, [userId])

  async function loadAll() {
    setLoading(true)
    try {
      const [cR, sR, pR] = await Promise.all([
        supabase.from('categories').select('*').order('created_at'),
        supabase.from('subcategories').select('*').order('created_at'),
        supabase.from('prompts').select('*').order('created_at'),
      ])
      setData({
        categories:    (cR.data || []).map(mapCat),
        subcategories: (sR.data || []).map(mapSub),
        prompts:       (pR.data || []).map(mapPrompt),
      })
    } finally {
      setLoading(false)
    }
  }

  const addCategory = useCallback(async (name, icon) => {
    const { data: row } = await supabase
      .from('categories').insert({ user_id: userId, name, icon: icon || '📁' })
      .select().single()
    if (row) setData(d => ({ ...d, categories: [...d.categories, mapCat(row)] }))
  }, [userId])

  const deleteCategory = useCallback(async (id) => {
    await supabase.from('categories').delete().eq('id', id)
    setData(d => ({
      ...d,
      categories:    d.categories.filter(c => c.id !== id),
      subcategories: d.subcategories.filter(s => s.catId !== id),
      prompts:       d.prompts.filter(p => p.catId !== id),
    }))
  }, [])

  const addSubcategory = useCallback(async (catId, name) => {
    const { data: row } = await supabase
      .from('subcategories').insert({ user_id: userId, cat_id: catId, name })
      .select().single()
    if (row) setData(d => ({ ...d, subcategories: [...d.subcategories, mapSub(row)] }))
  }, [userId])

  const deleteSubcategory = useCallback(async (id) => {
    await supabase.from('subcategories').delete().eq('id', id)
    setData(d => ({
      ...d,
      subcategories: d.subcategories.filter(s => s.id !== id),
      prompts:       d.prompts.map(p => p.subId === id ? { ...p, subId: null } : p),
    }))
  }, [])

  const addPrompt = useCallback(async (prompt) => {
    const { data: row } = await supabase
      .from('prompts')
      .insert({
        user_id: userId,
        cat_id:  prompt.catId,
        sub_id:  prompt.subId || null,
        name:    prompt.name,
        text:    prompt.text || '',
        aspect:  prompt.aspect || '1:1',
      })
      .select().single()
    if (row) setData(d => ({ ...d, prompts: [...d.prompts, mapPrompt(row)] }))
  }, [userId])

  const updatePrompt = useCallback(async (id, fields) => {
    const patch = {}
    if (fields.catId  !== undefined) patch.cat_id = fields.catId
    if (fields.subId  !== undefined) patch.sub_id = fields.subId || null
    if (fields.name   !== undefined) patch.name   = fields.name
    if (fields.text   !== undefined) patch.text   = fields.text
    if (fields.aspect !== undefined) patch.aspect = fields.aspect
    await supabase.from('prompts').update(patch).eq('id', id)
    setData(d => ({ ...d, prompts: d.prompts.map(p => p.id === id ? { ...p, ...fields } : p) }))
  }, [])

  const deletePrompt = useCallback(async (id) => {
    await supabase.from('prompts').delete().eq('id', id)
    setData(d => ({ ...d, prompts: d.prompts.filter(p => p.id !== id) }))
  }, [])

  const setPromptImage = useCallback(async (id, img) => {
    await supabase.from('prompts').update({ img }).eq('id', id)
    setData(d => ({ ...d, prompts: d.prompts.map(p => p.id === id ? { ...p, img } : p) }))
  }, [])

  // Migra dados do localStorage para o Supabase (roda apenas uma vez)
  const migrateFromLocalStorage = useCallback(async () => {
    const KEY = 'prompt_gallery_v1'
    const raw = localStorage.getItem(KEY)
    if (!raw) return
    try {
      const local = JSON.parse(raw)
      if (!local.categories?.length && !local.prompts?.length) {
        localStorage.removeItem(KEY)
        return
      }
      const idMap = {}
      for (const cat of (local.categories || [])) {
        const { data: row } = await supabase
          .from('categories').insert({ user_id: userId, name: cat.name, icon: cat.icon })
          .select().single()
        if (row) idMap[cat.id] = row.id
      }
      for (const sub of (local.subcategories || [])) {
        const newCatId = idMap[sub.catId]
        if (!newCatId) continue
        const { data: row } = await supabase
          .from('subcategories').insert({ user_id: userId, cat_id: newCatId, name: sub.name })
          .select().single()
        if (row) idMap[sub.id] = row.id
      }
      for (const p of (local.prompts || [])) {
        const newCatId = idMap[p.catId]
        if (!newCatId) continue
        await supabase.from('prompts').insert({
          user_id: userId,
          cat_id:  newCatId,
          sub_id:  p.subId ? (idMap[p.subId] || null) : null,
          name:    p.name,
          text:    p.text || '',
          img:     p.img || null,
          aspect:  p.aspect || '1:1',
        })
      }
      localStorage.removeItem(KEY)
      await loadAll()
    } catch (e) {
      console.error('Erro na migração:', e)
    }
  }, [userId])

  return {
    data, loading,
    migrateFromLocalStorage,
    addCategory, deleteCategory,
    addSubcategory, deleteSubcategory,
    addPrompt, updatePrompt, deletePrompt,
    setPromptImage,
  }
}

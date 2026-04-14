import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const mapCat    = r => ({ id: r.id, name: r.name, icon: r.icon, sortOrder: r.sort_order ?? 0 })
const mapSub    = r => ({ id: r.id, catId: r.cat_id, name: r.name, sortOrder: r.sort_order ?? 0 })
const mapPrompt = r => ({ id: r.id, catId: r.cat_id, subId: r.sub_id, name: r.name, text: r.text, img: r.img, aspect: r.aspect || '1:1' })
const EMPTY = { categories: [], subcategories: [], prompts: [] }

function throwIf(error, label) {
  if (error) { console.error('[useStore] ' + label + ':', error); throw new Error(error.message || label) }
}

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
        supabase.from('categories').select('*').order('sort_order').order('created_at'),
        supabase.from('subcategories').select('*').order('sort_order').order('created_at'),
        supabase.from('prompts').select('*').order('created_at'),
      ])
      // If sort_order column doesn't exist yet, fall back to ordering by created_at only
      const [cFinal, sFinal] = await Promise.all([
        cR.error ? supabase.from('categories').select('*').order('created_at') : Promise.resolve(cR),
        sR.error ? supabase.from('subcategories').select('*').order('created_at') : Promise.resolve(sR),
      ])
      if (cFinal.error) console.error('[useStore] categories:', cFinal.error)
      if (sFinal.error) console.error('[useStore] subcategories:', sFinal.error)
      if (pR.error)     console.error('[useStore] prompts:', pR.error)
      setData({
        categories:    (cFinal.data || []).map(mapCat),
        subcategories: (sFinal.data || []).map(mapSub),
        prompts:       (pR.data    || []).map(mapPrompt),
      })
    } catch (e) { console.error('[useStore] loadAll:', e) }
    finally { setLoading(false) }
  }

  const addCategory = useCallback(async (name, icon, sortOrder = 0) => {
    const { data: row, error } = await supabase.from('categories')
      .insert({ user_id: userId, name, icon: icon || '📁', sort_order: sortOrder }).select().single()
    throwIf(error, 'addCategory')
    setData(d => ({ ...d, categories: [...d.categories, mapCat(row)] }))
  }, [userId])

  const updateCategory = useCallback(async (id, fields) => {
    const patch = {}
    if (fields.name !== undefined) patch.name = fields.name
    if (fields.icon !== undefined) patch.icon = fields.icon
    const { error } = await supabase.from('categories').update(patch).eq('id', id)
    throwIf(error, 'updateCategory')
    setData(d => ({ ...d, categories: d.categories.map(c => c.id === id ? { ...c, ...fields } : c) }))
  }, [])

  const deleteCategory = useCallback(async (id) => {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    throwIf(error, 'deleteCategory')
    setData(d => ({
      ...d,
      categories:    d.categories.filter(c => c.id !== id),
      subcategories: d.subcategories.filter(s => s.catId !== id),
      prompts:       d.prompts.filter(p => p.catId !== id),
    }))
  }, [])

  const moveCategory = useCallback(async (id, direction, currentCats) => {
    const sorted = [...currentCats].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    const idx    = sorted.findIndex(c => c.id === id)
    const target = direction === 'up' ? idx - 1 : idx + 1
    if (idx < 0 || target < 0 || target >= sorted.length) return
    const a = sorted[idx], b = sorted[target]
    const aOrd = a.sortOrder ?? idx, bOrd = b.sortOrder ?? target
    const [r1, r2] = await Promise.all([
      supabase.from('categories').update({ sort_order: bOrd }).eq('id', a.id),
      supabase.from('categories').update({ sort_order: aOrd }).eq('id', b.id),
    ])
    throwIf(r1.error, 'moveCategory'); throwIf(r2.error, 'moveCategory')
    setData(d => ({
      ...d,
      categories: d.categories
        .map(c => c.id === a.id ? { ...c, sortOrder: bOrd } : c.id === b.id ? { ...c, sortOrder: aOrd } : c)
        .sort((x, y) => (x.sortOrder ?? 0) - (y.sortOrder ?? 0)),
    }))
  }, [])

  const addSubcategory = useCallback(async (catId, name, sortOrder = 0) => {
    const { data: row, error } = await supabase.from('subcategories')
      .insert({ user_id: userId, cat_id: catId, name, sort_order: sortOrder }).select().single()
    throwIf(error, 'addSubcategory')
    setData(d => ({ ...d, subcategories: [...d.subcategories, mapSub(row)] }))
  }, [userId])

  const updateSubcategory = useCallback(async (id, fields) => {
    const patch = {}
    if (fields.name !== undefined) patch.name = fields.name
    const { error } = await supabase.from('subcategories').update(patch).eq('id', id)
    throwIf(error, 'updateSubcategory')
    setData(d => ({ ...d, subcategories: d.subcategories.map(s => s.id === id ? { ...s, ...fields } : s) }))
  }, [])

  const deleteSubcategory = useCallback(async (id) => {
    const { error } = await supabase.from('subcategories').delete().eq('id', id)
    throwIf(error, 'deleteSubcategory')
    setData(d => ({
      ...d,
      subcategories: d.subcategories.filter(s => s.id !== id),
      prompts:       d.prompts.map(p => p.subId === id ? { ...p, subId: null } : p),
    }))
  }, [])

  const moveSubcategory = useCallback(async (id, direction, allSubs) => {
    const sub     = allSubs.find(s => s.id === id); if (!sub) return
    const catSubs = allSubs.filter(s => s.catId === sub.catId).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    const idx     = catSubs.findIndex(s => s.id === id)
    const target  = direction === 'up' ? idx - 1 : idx + 1
    if (idx < 0 || target < 0 || target >= catSubs.length) return
    const a = catSubs[idx], b = catSubs[target]
    const aOrd = a.sortOrder ?? idx, bOrd = b.sortOrder ?? target
    const [r1, r2] = await Promise.all([
      supabase.from('subcategories').update({ sort_order: bOrd }).eq('id', a.id),
      supabase.from('subcategories').update({ sort_order: aOrd }).eq('id', b.id),
    ])
    throwIf(r1.error, 'moveSubcategory'); throwIf(r2.error, 'moveSubcategory')
    setData(d => ({
      ...d,
      subcategories: d.subcategories
        .map(s => s.id === a.id ? { ...s, sortOrder: bOrd } : s.id === b.id ? { ...s, sortOrder: aOrd } : s)
        .sort((x, y) => (x.sortOrder ?? 0) - (y.sortOrder ?? 0)),
    }))
  }, [])

  const addPrompt = useCallback(async ({ catId, subId, name, text, aspect }) => {
    const { data: row, error } = await supabase.from('prompts')
      .insert({ user_id: userId, cat_id: catId, sub_id: subId || null, name, text, aspect: aspect || '1:1' })
      .select().single()
    throwIf(error, 'addPrompt')
    setData(d => ({ ...d, prompts: [...d.prompts, mapPrompt(row)] }))
  }, [userId])

  const updatePrompt = useCallback(async (id, { catId, subId, name, text, aspect }) => {
    const { error } = await supabase.from('prompts')
      .update({ cat_id: catId, sub_id: subId || null, name, text, aspect: aspect || '1:1' })
      .eq('id', id)
    throwIf(error, 'updatePrompt')
    setData(d => ({
      ...d,
      prompts: d.prompts.map(p =>
        p.id === id ? { ...p, catId, subId: subId || null, name, text, aspect: aspect || '1:1' } : p
      ),
    }))
  }, [])

  const deletePrompt = useCallback(async (id) => {
    const { error } = await supabase.from('prompts').delete().eq('id', id)
    throwIf(error, 'deletePrompt')
    setData(d => ({ ...d, prompts: d.prompts.filter(p => p.id !== id) }))
  }, [])

  const setPromptImage = useCallback(async (id, file) => {
    const ext  = file.name.split('.').pop()
    const path = userId + '/' + id + '.' + ext
    const { error: upErr } = await supabase.storage
      .from('prompt-images').upload(path, file, { upsert: true })
    throwIf(upErr, 'setPromptImage upload')
    const { data: { publicUrl } } = supabase.storage.from('prompt-images').getPublicUrl(path)
    const { error: dbErr } = await supabase.from('prompts').update({ img: publicUrl }).eq('id', id)
    throwIf(dbErr, 'setPromptImage update')
    setData(d => ({ ...d, prompts: d.prompts.map(p => p.id === id ? { ...p, img: publicUrl } : p) }))
  }, [userId])

  const migrateFromLocalStorage = useCallback(async () => {
    const raw = localStorage.getItem('promptGalleryData')
    if (!raw) return
    try {
      const old = JSON.parse(raw)
      for (const cat of (old.categories || [])) {
        const { data: cRow, error: cErr } = await supabase.from('categories')
          .insert({ user_id: userId, name: cat.name, icon: cat.icon || '📁', sort_order: 0 })
          .select().single()
        if (cErr) continue
        const subMap = {}
        for (const sub of (old.subcategories || []).filter(s => s.catId === cat.id)) {
          const { data: sRow, error: sErr } = await supabase.from('subcategories')
            .insert({ user_id: userId, cat_id: cRow.id, name: sub.name, sort_order: 0 })
            .select().single()
          if (!sErr) subMap[sub.id] = sRow.id
        }
        for (const p of (old.prompts || []).filter(pr => pr.catId === cat.id)) {
          await supabase.from('prompts').insert({
            user_id: userId, cat_id: cRow.id,
            sub_id: p.subId ? (subMap[p.subId] || null) : null,
            name: p.name, text: p.text || '', aspect: p.aspect || '1:1',
          })
        }
      }
      localStorage.removeItem('promptGalleryData')
      await loadAll()
    } catch (e) { console.error('[useStore] migrate:', e) }
  }, [userId])

  return {
    data, loading,
    addCategory, updateCategory, deleteCategory, moveCategory,
    addSubcategory, updateSubcategory, deleteSubcategory, moveSubcategory,
    addPrompt, updatePrompt, deletePrompt, setPromptImage,
    migrateFromLocalStorage,
  }
}
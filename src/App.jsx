import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Sun, Moon, LogOut } from 'lucide-react'
import { supabase } from './lib/supabase'
import { useStore } from './hooks/useStore'
import Sidebar from './components/Sidebar'
import PromptCard from './components/PromptCard'
import Modal from './components/Modal'
import Field from './components/Field'
import Auth from './components/Auth'
import ImageModal from './components/ImageModal'
import styles from './App.module.css'

export default function App() {
  const [session, setSession] = useState(undefined)
  const [isDark, setIsDark]   = useState(() => localStorage.getItem('theme') !== 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => setSession(session))
      .catch(() => setSession(null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className={styles.loadingScreen}>
        <span className={styles.loadingIcon}>✶</span>
      </div>
    )
  }

  if (!session) return <Auth />
  return <MainApp session={session} isDark={isDark} setIsDark={setIsDark} />
}

function MainApp({ session, isDark, setIsDark }) {
  const store = useStore(session.user.id)
  const { data, loading } = store

  const [selectedCat, setSelectedCat] = useState(null)
  const [selectedSub, setSelectedSub] = useState(null)
  const [search, setSearch]           = useState('')
  const [modal, setModal]             = useState(null)
  const [form, setForm]               = useState({})
  const [imgModal, setImgModal]       = useState(null)
  const [modalError, setModalError]   = useState(null)
  const [draggedPId, setDraggedPId]   = useState(null)
  const [dragOverPId, setDragOverPId] = useState(null)
  const migrated = useRef(false)

  useEffect(() => {
    if (!loading && !migrated.current) {
      migrated.current = true
      store.migrateFromLocalStorage()
    }
  }, [loading])

  function openModal(type, extra = {}) { setForm(extra); setModal(type); setModalError(null) }
  function closeModal()                { setModal(null); setForm({}); setModalError(null) }
  function f(key) { return e => setForm(prev => ({ ...prev, [key]: e.target.value })) }

  async function saveCategory() {
    if (!form.name?.trim()) return
    try {
      await store.addCategory(form.name.trim(), form.icon?.trim() || '📁', data.categories.length)
      closeModal()
    } catch (err) { setModalError(err.message) }
  }

  async function saveSub() {
    if (!form.name?.trim() || !form.catId) return
    try {
      const siblingCount = data.subcategories.filter(s => s.catId === form.catId).length
      await store.addSubcategory(form.catId, form.name.trim(), siblingCount)
      closeModal()
    } catch (err) { setModalError(err.message) }
  }

  function openEditCat(cat) {
    openModal('editCat', { editId: cat.id, name: cat.name, icon: cat.icon })
  }

  async function saveEditCat() {
    if (!form.name?.trim()) return
    try {
      await store.updateCategory(form.editId, { name: form.name.trim(), icon: form.icon?.trim() || '📁' })
      closeModal()
    } catch (err) { setModalError(err.message) }
  }

  function openEditSub(sub) {
    openModal('editSub', { editId: sub.id, name: sub.name })
  }

  async function saveEditSub() {
    if (!form.name?.trim()) return
    try {
      await store.updateSubcategory(form.editId, { name: form.name.trim() })
      closeModal()
    } catch (err) { setModalError(err.message) }
  }

  function reorderCats(orderedIds) { store.reorderCategories(orderedIds).catch(console.error) }
  function reorderSubs(catId, orderedIds) { store.reorderSubcategories(catId, orderedIds).catch(console.error) }

  function promptDragStart(id) { setDraggedPId(id) }
  function promptDragOver(e, id) { e.preventDefault(); if (id !== draggedPId) setDragOverPId(id) }
  function promptDragEnd() { setDraggedPId(null); setDragOverPId(null) }
  function promptDrop(targetId) {
    setDragOverPId(null)
    if (!draggedPId || draggedPId === targetId) { setDraggedPId(null); return }
    const from = filtered.findIndex(p => p.id === draggedPId)
    const to   = filtered.findIndex(p => p.id === targetId)
    setDraggedPId(null)
    if (from < 0 || to < 0) return
    const next = [...filtered]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    store.reorderPrompts(next.map(p => p.id)).catch(console.error)
  }

  async function savePrompt() {
    if (!form.name?.trim() || !form.catId) return
    const payload = {
      catId:  form.catId,
      subId:  form.subId || null,
      name:   form.name.trim(),
      text:   form.text?.trim() || '',
      aspect: form.aspect || '1:1',
    }
    try {
      if (form.editId) await store.updatePrompt(form.editId, payload)
      else             await store.addPrompt(payload)
      closeModal()
    } catch (err) { setModalError(err.message) }
  }

  function deleteCategory(id) {
    if (!confirm('Excluir categoria e todos os seus prompts?')) return
    if (selectedCat === id) { setSelectedCat(null); setSelectedSub(null) }
    store.deleteCategory(id)
  }

  function deleteSub(id) {
    if (!confirm('Excluir subcategoria?')) return
    if (selectedSub === id) setSelectedSub(null)
    store.deleteSubcategory(id)
  }

  function editPrompt(prompt) {
    openModal('prompt', {
      editId: prompt.id,
      catId:  prompt.catId,
      subId:  prompt.subId,
      name:   prompt.name,
      text:   prompt.text,
      aspect: prompt.aspect || '1:1',
    })
  }

  async function handleLogout() { await supabase.auth.signOut() }

  const filtered = data.prompts
    .filter(p => {
      if (selectedSub) return p.subId === selectedSub
      if (selectedCat) return p.catId === selectedCat
      return true
    })
    .filter(p => {
      if (!search) return true
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.text.toLowerCase().includes(q)
    })
  const cat       = data.categories.find(c => c.id === selectedCat)
  const sub       = data.subcategories.find(s => s.id === selectedSub)
  const viewTitle = sub?.name ?? (cat ? (cat.icon + ' ' + cat.name) : 'Todos os prompts')
  const subsByForm = data.subcategories.filter(s => s.catId === form.catId)

  return (
    <div className={styles.app}>
      <Sidebar
        data={data}
        selectedCat={selectedCat}
        selectedSub={selectedSub}
        onSelectCat={setSelectedCat}
        onSelectSub={setSelectedSub}
        onAddCat={() => openModal('cat')}
        onAddSub={catId => openModal('sub', { catId })}
        onDeleteCat={deleteCategory}
        onDeleteSub={deleteSub}
        onEditCat={openEditCat}
        onEditSub={openEditSub}
        onReorderCats={reorderCats}
        onReorderSubs={reorderSubs}
      />
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.viewHead}>
            <h1 className={styles.viewTitle}>{viewTitle}</h1>
            <span className={styles.viewCount}>{filtered.length} prompt{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          <div className={styles.actions}>
            <button className={styles.themeBtn} onClick={() => setIsDark(d => !d)} title={isDark ? 'Modo claro' : 'Modo escuro'}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className={styles.searchWrap}>
              <Search size={14} className={styles.searchIcon} />
              <input className={styles.search} placeholder='Buscar prompts...' value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className={styles.addBtn} onClick={() => openModal('prompt', { catId: selectedCat || data.categories[0]?.id, subId: selectedSub, aspect: '1:1' })}>
              <Plus size={15} /> Novo prompt
            </button>
            <button className={styles.logoutBtn} onClick={handleLogout} title='Sair'>
              <LogOut size={15} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingData}><span className={styles.loadingIcon}>✶</span></div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>✶</div>
            <p>Nenhum prompt aqui ainda</p>
            <button className={styles.emptyBtn} onClick={() => openModal('prompt', { catId: selectedCat || data.categories[0]?.id, subId: selectedSub, aspect: '1:1' })}>
              + Adicionar primeiro prompt
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map(p => (
              <PromptCard
                key={p.id}
                prompt={p}
                cat={data.categories.find(c => c.id === p.catId)}
                sub={data.subcategories.find(s => s.id === p.subId)}
                onEdit={editPrompt}
                onDelete={id => { if (confirm('Excluir este prompt?')) store.deletePrompt(id) }}
                onImageUpload={store.setPromptImage}
                onImageClick={setImgModal}
                dragging={draggedPId === p.id}
                dragOver={dragOverPId === p.id}
                onDragStart={() => promptDragStart(p.id)}
                onDragOver={e => promptDragOver(e, p.id)}
                onDrop={() => promptDrop(p.id)}
                onDragEnd={promptDragEnd}
              />
            ))}
          </div>
        )}
      </main>
      {modal === 'cat' && (
        <Modal title='Nova categoria' onClose={closeModal} onSave={saveCategory}>
          {modalError && <p className={styles.modalError}>{modalError}</p>}

          <Field label='Nome da categoria'>
            <input placeholder='Ex: Casamento' value={form.name || ''} onChange={f('name')} autoFocus />
          </Field>
          <Field label='Icone (emoji)'>
            <input placeholder='Ex: 💍' value={form.icon || ''} onChange={f('icon')} maxLength={2} />
          </Field>
        </Modal>
      )}

      {modal === 'sub' && (
        <Modal title='Nova subcategoria' onClose={closeModal} onSave={saveSub}>
          {modalError && <p className={styles.modalError}>{modalError}</p>}

          <Field label='Categoria'>
            <select value={form.catId || ''} onChange={f('catId')}>
              {data.categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </Field>
          <Field label='Nome da subcategoria'>
            <input placeholder='Ex: Foto Realista' value={form.name || ''} onChange={f('name')} autoFocus />
          </Field>
        </Modal>
      )}

      {modal === 'prompt' && (
        <Modal
          title={form.editId ? 'Editar prompt' : 'Novo prompt'}
          onClose={closeModal}
          onSave={savePrompt}
          saveLabel={form.editId ? 'Salvar' : 'Adicionar'}
        >
          {modalError && <p className={styles.modalError}>{modalError}</p>}

          <Field label='Categoria'>
            <select value={form.catId || ''} onChange={e => setForm(prev => ({ ...prev, catId: e.target.value, subId: null }))}>
              {data.categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </Field>
          <Field label='Subcategoria'>
            <select value={form.subId || ''} onChange={f('subId')}>
              <option value=''>— Nenhuma —</option>
              {subsByForm.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label='Nome do prompt'>
            <input placeholder='Ex: Casal ao Por do Sol' value={form.name || ''} onChange={f('name')} autoFocus={!form.editId} />
          </Field>
          <Field label='Proporcao da imagem'>
            <select value={form.aspect || '1:1'} onChange={f('aspect')}>
              <option value='9:16'>9:16 — Retrato (vertical)</option>
              <option value='1:1'>1:1 — Quadrado</option>
              <option value='16:9'>16:9 — Paisagem (horizontal)</option>
            </select>
          </Field>
          <Field label='Prompt'>
            <textarea placeholder='Cole aqui o prompt completo...' value={form.text || ''} onChange={f('text')} rows={5} />
          </Field>
        </Modal>
      )}

      {modal === 'editCat' && (
        <Modal title='Editar categoria' onClose={closeModal} onSave={saveEditCat} saveLabel='Salvar'>
          {modalError && <p className={styles.modalError}>{modalError}</p>}
          <Field label='Nome da categoria'>
            <input placeholder='Ex: Casamento' value={form.name || ''} onChange={f('name')} autoFocus />
          </Field>
          <Field label='Icone (emoji)'>
            <input placeholder='Ex: 💍' value={form.icon || ''} onChange={f('icon')} maxLength={2} />
          </Field>
        </Modal>
      )}

      {modal === 'editSub' && (
        <Modal title='Editar subcategoria' onClose={closeModal} onSave={saveEditSub} saveLabel='Salvar'>
          {modalError && <p className={styles.modalError}>{modalError}</p>}
          <Field label='Nome da subcategoria'>
            <input placeholder='Ex: Foto Realista' value={form.name || ''} onChange={f('name')} autoFocus />
          </Field>
        </Modal>
      )}

      {imgModal && (
        <ImageModal src={imgModal.img} name={imgModal.name} aspect={imgModal.aspect} onClose={() => setImgModal(null)} />
      )}
    </div>
  )
}

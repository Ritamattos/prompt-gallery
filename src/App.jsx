import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { useStore } from './hooks/useStore'
import Sidebar from './components/Sidebar'
import PromptCard from './components/PromptCard'
import Modal from './components/Modal'
import Field from './components/Field'
import styles from './App.module.css'

export default function App() {
  const store = useStore()
  const { data } = store

  const [selectedCat, setSelectedCat] = useState(null)
  const [selectedSub, setSelectedSub] = useState(null)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})

  function openModal(type, extra = {}) {
    setForm(extra)
    setModal(type)
  }
  function closeModal() { setModal(null); setForm({}) }

  function f(key) { return e => setForm(prev => ({ ...prev, [key]: e.target.value })) }

  function saveCategory() {
    if (!form.name?.trim()) return
    store.addCategory(form.name.trim(), form.icon?.trim() || '📁')
    closeModal()
  }

  function saveSub() {
    if (!form.name?.trim() || !form.catId) return
    store.addSubcategory(form.catId, form.name.trim())
    closeModal()
  }

  function savePrompt() {
    if (!form.name?.trim() || !form.catId) return
    const payload = { catId: form.catId, subId: form.subId || null, name: form.name.trim(), text: form.text?.trim() || '' }
    if (form.editId) {
      store.updatePrompt(form.editId, payload)
    } else {
      store.addPrompt(payload)
    }
    closeModal()
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
      catId: prompt.catId,
      subId: prompt.subId,
      name: prompt.name,
      text: prompt.text,
    })
  }

  const filtered = data.prompts.filter(p => {
    if (selectedSub) return p.subId === selectedSub
    if (selectedCat) return p.catId === selectedCat
    return true
  }).filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return p.name.toLowerCase().includes(q) || p.text.toLowerCase().includes(q)
  })

  const cat = data.categories.find(c => c.id === selectedCat)
  const sub = data.subcategories.find(s => s.id === selectedSub)
  const viewTitle = sub?.name ?? (cat ? `${cat.icon} ${cat.name}` : 'Todos os prompts')

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
        onAddSub={(catId) => openModal('sub', { catId })}
        onDeleteCat={deleteCategory}
        onDeleteSub={deleteSub}
      />

      <main className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.viewHead}>
            <h1 className={styles.viewTitle}>{viewTitle}</h1>
            <span className={styles.viewCount}>{filtered.length} prompt{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          <div className={styles.actions}>
            <div className={styles.searchWrap}>
              <Search size={14} className={styles.searchIcon} />
              <input
                className={styles.search}
                placeholder="Buscar prompts..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button
              className={styles.addBtn}
              onClick={() => openModal('prompt', { catId: selectedCat || data.categories[0]?.id, subId: selectedSub })}
            >
              <Plus size={15} /> Novo prompt
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>✦</div>
            <p>Nenhum prompt aqui ainda</p>
            <button
              className={styles.emptyBtn}
              onClick={() => openModal('prompt', { catId: selectedCat || data.categories[0]?.id, subId: selectedSub })}
            >
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
              />
            ))}
          </div>
        )}
      </main>

      {modal === 'cat' && (
        <Modal title="Nova categoria" onClose={closeModal} onSave={saveCategory}>
          <Field label="Nome da categoria">
            <input placeholder="Ex: Casamento" value={form.name || ''} onChange={f('name')} autoFocus />
          </Field>
          <Field label="Ícone (emoji)">
            <input placeholder="Ex: 💍" value={form.icon || ''} onChange={f('icon')} maxLength={2} />
          </Field>
        </Modal>
      )}

      {modal === 'sub' && (
        <Modal title="Nova subcategoria" onClose={closeModal} onSave={saveSub}>
          <Field label="Categoria">
            <select value={form.catId || ''} onChange={f('catId')}>
              {data.categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </Field>
          <Field label="Nome da subcategoria">
            <input placeholder="Ex: Foto Realista" value={form.name || ''} onChange={f('name')} autoFocus />
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
          <Field label="Categoria">
            <select value={form.catId || ''} onChange={e => setForm(prev => ({ ...prev, catId: e.target.value, subId: null }))}>
              {data.categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </Field>
          <Field label="Subcategoria">
            <select value={form.subId || ''} onChange={f('subId')}>
              <option value="">— Nenhuma —</option>
              {subsByForm.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Nome do prompt">
            <input placeholder="Ex: Casal ao Pôr do Sol" value={form.name || ''} onChange={f('name')} autoFocus={!form.editId} />
          </Field>
          <Field label="Prompt">
            <textarea placeholder="Cole aqui o prompt completo..." value={form.text || ''} onChange={f('text')} rows={5} />
          </Field>
        </Modal>
      )}
    </div>
  )
}

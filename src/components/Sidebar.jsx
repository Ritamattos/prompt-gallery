import { useState, useEffect } from 'react'
import { MoreHorizontal, Pencil, Trash2, GripVertical } from 'lucide-react'
import styles from './Sidebar.module.css'

export default function Sidebar({
  data, selectedCat, selectedSub,
  onSelectCat, onSelectSub,
  onAddCat, onAddSub,
  onDeleteCat, onDeleteSub,
  onEditCat, onEditSub,
  onReorderCats, onReorderSubs,
  activeView, onViewChange,
  selectedAiCat, onSelectAiCat,
  onAddAiCat, onDeleteAiCat, onEditAiCat,
}) {
  const [menu, setMenu]           = useState(null)
  const [draggedId, setDraggedId] = useState(null)
  const [dragType, setDragType]   = useState(null)   // 'cat' | 'sub'
  const [dragOverId, setDragOverId] = useState(null)

  function openMenu(e, type, id) {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setMenu({ type, id, top: rect.bottom + 4, left: rect.left })
  }
  function closeMenu() { setMenu(null) }

  useEffect(() => {
    document.addEventListener('click', closeMenu)
    return () => document.removeEventListener('click', closeMenu)
  }, [])

  // ── drag helpers ──────────────────────────────────────────
  function dragStart(e, id, type) {
    setDraggedId(id)
    setDragType(type)
    e.dataTransfer.effectAllowed = 'move'
  }

  function dragOver(e, id, type) {
    e.preventDefault()
    if (type !== dragType) return   // don't mix cats ↔ subs
    if (id !== draggedId) setDragOverId(id)
  }

  function drop(e, targetId, type) {
    e.preventDefault()
    setDragOverId(null)
    if (!draggedId || draggedId === targetId || type !== dragType) return

    if (type === 'cat') {
      const sorted = [...data.categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      const from = sorted.findIndex(c => c.id === draggedId)
      const to   = sorted.findIndex(c => c.id === targetId)
      if (from < 0 || to < 0) return
      const next = [...sorted]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      onReorderCats(next.map(c => c.id))
    } else {
      const sub = data.subcategories.find(s => s.id === draggedId)
      if (!sub) return
      const catSubs = data.subcategories
        .filter(s => s.catId === sub.catId)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      const from = catSubs.findIndex(s => s.id === draggedId)
      const to   = catSubs.findIndex(s => s.id === targetId)
      if (from < 0 || to < 0) return
      const next = [...catSubs]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      onReorderSubs(sub.catId, next.map(s => s.id))
    }
  }

  function dragEnd() {
    setDraggedId(null)
    setDragType(null)
    setDragOverId(null)
  }

  // ─────────────────────────────────────────────────────────
  const sortedCats = [...data.categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>✦</span>
        <span className={styles.logoText}>Galeria</span>
      </div>

      <div className={styles.viewTabs}>
        <button
          className={`${styles.viewTab} ${activeView === 'prompts' ? styles.viewTabActive : ''}`}
          onClick={() => onViewChange('prompts')}
        >Prompts</button>
        <button
          className={`${styles.viewTab} ${activeView === 'ias' ? styles.viewTabActive : ''}`}
          onClick={() => onViewChange('ias')}
        >IAs</button>
      </div>

      {activeView === 'ias' && <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>Categorias</span>
          <button className={styles.addBtn} onClick={onAddAiCat} title="Nova categoria">+</button>
        </div>

        <div
          className={`${styles.item} ${!selectedAiCat ? styles.active : ''}`}
          onClick={() => onSelectAiCat(null)}
        >
          <span className={styles.itemIcon}>◈</span>
          <span className={styles.itemName}>Todos</span>
          <span className={styles.count}>{data.aiTools.length}</span>
        </div>

        {[...data.aiCategories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)).map(cat => (
          <div key={cat.id} className={styles.dragRow}>
            <div
              className={`${styles.item} ${selectedAiCat === cat.id ? styles.active : ''}`}
              onClick={() => onSelectAiCat(cat.id)}
            >
              <span className={styles.itemIcon}>{cat.icon}</span>
              <span className={styles.itemName}>{cat.name}</span>
              <div className={styles.itemRight}>
                <button
                  className={styles.menuBtn}
                  onClick={e => openMenu(e, 'aiCat', cat.id)}
                  title="Opções"
                >
                  <MoreHorizontal size={13} />
                </button>
                <span className={styles.count}>{data.aiTools.filter(a => a.aiCatId === cat.id).length}</span>
              </div>
            </div>
          </div>
        ))}
      </div>}

      {activeView === 'prompts' && <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>Categorias</span>
          <button className={styles.addBtn} onClick={onAddCat} title="Nova categoria">+</button>
        </div>

        <div
          className={`${styles.item} ${!selectedCat ? styles.active : ''}`}
          onClick={() => { onSelectCat(null); onSelectSub(null) }}
        >
          <span className={styles.itemIcon}>◈</span>
          <span className={styles.itemName}>Todos</span>
          <span className={styles.count}>{data.prompts.length}</span>
        </div>

        {sortedCats.map(cat => {
          const subs     = data.subcategories.filter(s => s.catId === cat.id).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          const count    = data.prompts.filter(p => p.catId === cat.id).length
          const isActive = selectedCat === cat.id

          return (
            <div
              key={cat.id}
              draggable
              onDragStart={e => dragStart(e, cat.id, 'cat')}
              onDragOver={e => dragOver(e, cat.id, 'cat')}
              onDrop={e => drop(e, cat.id, 'cat')}
              onDragEnd={dragEnd}
              className={`${styles.dragRow} ${draggedId === cat.id ? styles.dragging : ''} ${dragOverId === cat.id ? styles.dragOver : ''}`}
            >
              <div
                className={`${styles.item} ${isActive ? styles.active : ''}`}
                onClick={() => { onSelectCat(cat.id); onSelectSub(null) }}
              >
                <span className={styles.grip}><GripVertical size={12} /></span>
                <span className={styles.itemIcon}>{cat.icon}</span>
                <span className={styles.itemName}>{cat.name}</span>
                <div className={styles.itemRight}>
                  <button
                    className={styles.menuBtn}
                    onClick={e => openMenu(e, 'cat', cat.id)}
                    title="Opções"
                  >
                    <MoreHorizontal size={13} />
                  </button>
                  <span className={styles.count}>{count}</span>
                </div>
              </div>

              {isActive && (
                <div className={styles.subList}>
                  <div
                    className={`${styles.subItem} ${!selectedSub ? styles.subActive : ''}`}
                    onClick={() => onSelectSub(null)}
                  >Todos</div>

                  {subs.map(sub => (
                    <div
                      key={sub.id}
                      draggable
                      onDragStart={e => { e.stopPropagation(); dragStart(e, sub.id, 'sub') }}
                      onDragOver={e => { e.stopPropagation(); dragOver(e, sub.id, 'sub') }}
                      onDrop={e => { e.stopPropagation(); drop(e, sub.id, 'sub') }}
                      onDragEnd={e => { e.stopPropagation(); dragEnd() }}
                      className={`${styles.dragRow} ${draggedId === sub.id ? styles.dragging : ''} ${dragOverId === sub.id ? styles.dragOver : ''}`}
                    >
                      <div
                        className={`${styles.subItem} ${selectedSub === sub.id ? styles.subActive : ''}`}
                        onClick={() => onSelectSub(sub.id)}
                      >
                        <span className={styles.grip}><GripVertical size={11} /></span>
                        <span className={styles.subName}>{sub.name}</span>
                        <div className={styles.itemRight}>
                          <button
                            className={styles.menuBtn}
                            onClick={e => { e.stopPropagation(); openMenu(e, 'sub', sub.id) }}
                            title="Opções"
                          >
                            <MoreHorizontal size={12} />
                          </button>
                          <span className={styles.count}>{data.prompts.filter(p => p.subId === sub.id).length}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button className={styles.addSubBtn} onClick={() => onAddSub(cat.id)}>
                    + subcategoria
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>}

      {menu && (
        <div
          className={styles.dropdown}
          style={{ top: menu.top, left: menu.left }}
          onClick={e => e.stopPropagation()}
        >
          <button onClick={() => {
            if (menu.type === 'cat')   onEditCat(data.categories.find(c => c.id === menu.id))
            else if (menu.type === 'sub')   onEditSub(data.subcategories.find(s => s.id === menu.id))
            else if (menu.type === 'aiCat') onEditAiCat(data.aiCategories.find(c => c.id === menu.id))
            closeMenu()
          }}>
            <Pencil size={12} /> Editar
          </button>

          <div className={styles.dropdownDivider} />

          <button
            className={styles.dropdownDanger}
            onClick={() => {
              if (menu.type === 'cat')        onDeleteCat(menu.id)
              else if (menu.type === 'sub')   onDeleteSub(menu.id)
              else if (menu.type === 'aiCat') onDeleteAiCat(menu.id)
              closeMenu()
            }}
          >
            <Trash2 size={12} /> Excluir
          </button>
        </div>
      )}
    </aside>
  )
}
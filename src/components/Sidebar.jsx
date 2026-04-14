import { useState, useEffect } from 'react'
import { MoreHorizontal, Pencil, ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import styles from './Sidebar.module.css'

export default function Sidebar({
  data, selectedCat, selectedSub,
  onSelectCat, onSelectSub,
  onAddCat, onAddSub,
  onDeleteCat, onDeleteSub,
  onEditCat, onEditSub,
  onMoveCat, onMoveSub,
}) {
  const [menu, setMenu] = useState(null)

  function openMenu(e, type, id, isFirst, isLast) {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setMenu({ type, id, top: rect.bottom + 4, left: rect.left, isFirst, isLast })
  }

  function closeMenu() { setMenu(null) }

  useEffect(() => {
    document.addEventListener('click', closeMenu)
    return () => document.removeEventListener('click', closeMenu)
  }, [])

  const sortedCats = [...data.categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>✦</span>
        <span className={styles.logoText}>Prompts</span>
      </div>

      <div className={styles.section}>
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

        {sortedCats.map((cat, idx) => {
          const subs   = data.subcategories.filter(s => s.catId === cat.id).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          const count  = data.prompts.filter(p => p.catId === cat.id).length
          const isActive = selectedCat === cat.id

          return (
            <div key={cat.id}>
              <div
                className={`${styles.item} ${isActive ? styles.active : ''}`}
                onClick={() => { onSelectCat(cat.id); onSelectSub(null) }}
              >
                <span className={styles.itemIcon}>{cat.icon}</span>
                <span className={styles.itemName}>{cat.name}</span>
                <div className={styles.itemRight}>
                  <button
                    className={styles.menuBtn}
                    onClick={e => openMenu(e, 'cat', cat.id, idx === 0, idx === sortedCats.length - 1)}
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

                  {subs.map((sub, sIdx) => (
                    <div
                      key={sub.id}
                      className={`${styles.subItem} ${selectedSub === sub.id ? styles.subActive : ''}`}
                      onClick={() => onSelectSub(sub.id)}
                    >
                      <span className={styles.subName}>{sub.name}</span>
                      <div className={styles.itemRight}>
                        <button
                          className={styles.menuBtn}
                          onClick={e => openMenu(e, 'sub', sub.id, sIdx === 0, sIdx === subs.length - 1)}
                          title="Opções"
                        >
                          <MoreHorizontal size={12} />
                        </button>
                        <span className={styles.count}>{data.prompts.filter(p => p.subId === sub.id).length}</span>
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
      </div>

      {menu && (
        <div
          className={styles.dropdown}
          style={{ top: menu.top, left: menu.left }}
          onClick={e => e.stopPropagation()}
        >
          <button onClick={() => {
            if (menu.type === 'cat') {
              onEditCat(data.categories.find(c => c.id === menu.id))
            } else {
              onEditSub(data.subcategories.find(s => s.id === menu.id))
            }
            closeMenu()
          }}>
            <Pencil size={12} /> Editar
          </button>

          {!menu.isFirst && (
            <button onClick={() => {
              if (menu.type === 'cat') onMoveCat(menu.id, 'up')
              else onMoveSub(menu.id, 'up')
              closeMenu()
            }}>
              <ChevronUp size={12} /> Mover para cima
            </button>
          )}

          {!menu.isLast && (
            <button onClick={() => {
              if (menu.type === 'cat') onMoveCat(menu.id, 'down')
              else onMoveSub(menu.id, 'down')
              closeMenu()
            }}>
              <ChevronDown size={12} /> Mover para baixo
            </button>
          )}

          <div className={styles.dropdownDivider} />

          <button
            className={styles.dropdownDanger}
            onClick={() => {
              if (menu.type === 'cat') onDeleteCat(menu.id)
              else onDeleteSub(menu.id)
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
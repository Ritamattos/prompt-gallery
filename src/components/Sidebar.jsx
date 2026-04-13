import { useState } from 'react'
import styles from './Sidebar.module.css'

export default function Sidebar({ data, selectedCat, selectedSub, onSelectCat, onSelectSub, onAddCat, onAddSub, onDeleteCat, onDeleteSub }) {
  const [hoveredCat, setHoveredCat] = useState(null)
  const [hoveredSub, setHoveredSub] = useState(null)

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

        {data.categories.map(cat => {
          const subs = data.subcategories.filter(s => s.catId === cat.id)
          const count = data.prompts.filter(p => p.catId === cat.id).length
          const isActive = selectedCat === cat.id

          return (
            <div key={cat.id}>
              <div
                className={`${styles.item} ${isActive ? styles.active : ''}`}
                onClick={() => { onSelectCat(cat.id); onSelectSub(null) }}
                onMouseEnter={() => setHoveredCat(cat.id)}
                onMouseLeave={() => setHoveredCat(null)}
              >
                <span className={styles.itemIcon}>{cat.icon}</span>
                <span className={styles.itemName}>{cat.name}</span>
                <div className={styles.itemRight}>
                  {hoveredCat === cat.id && (
                    <button
                      className={styles.deleteBtn}
                      onClick={e => { e.stopPropagation(); onDeleteCat(cat.id) }}
                      title="Excluir categoria"
                    >✕</button>
                  )}
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
                      className={`${styles.subItem} ${selectedSub === sub.id ? styles.subActive : ''}`}
                      onClick={() => onSelectSub(sub.id)}
                      onMouseEnter={() => setHoveredSub(sub.id)}
                      onMouseLeave={() => setHoveredSub(null)}
                    >
                      <span className={styles.subName}>{sub.name}</span>
                      <div className={styles.itemRight}>
                        {hoveredSub === sub.id && (
                          <button
                            className={styles.deleteBtn}
                            onClick={e => { e.stopPropagation(); onDeleteSub(sub.id) }}
                          >✕</button>
                        )}
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
    </aside>
  )
}

import { useEffect } from 'react'
import { X } from 'lucide-react'
import styles from './ImageModal.module.css'

const RATIOS = { '9:16': '9/16', '16:9': '16/9', '1:1': '1/1' }

export default function ImageModal({ src, name, aspect, onClose }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const ratio = RATIOS[aspect] || '1/1'

  return (
    <div className={styles.bg} onClick={onClose}>
      <div className={styles.container} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} title="Fechar (Esc)">
          <X size={18} />
        </button>
        <div className={styles.imgWrap} style={{ aspectRatio: ratio }}>
          <img src={src} alt={name} className={styles.img} />
        </div>
        {name && <p className={styles.name}>{name}</p>}
      </div>
    </div>
  )
}

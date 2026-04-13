import { useEffect, useRef } from 'react'
import styles from './Modal.module.css'

export default function Modal({ title, onClose, onSave, children, saveLabel = 'Salvar' }) {
  const ref = useRef()

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className={styles.bg} onClick={e => { if (e.target === ref.current) onClose() }} ref={ref}>
      <div className={styles.box}>
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.body}>{children}</div>
        <div className={styles.footer}>
          <button className={styles.cancel} onClick={onClose}>Cancelar</button>
          <button className={styles.save} onClick={onSave}>{saveLabel}</button>
        </div>
      </div>
    </div>
  )
}

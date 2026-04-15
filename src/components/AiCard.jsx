import { useRef, useState } from 'react'
import { ExternalLink, ImagePlus, Pencil, Trash2, GripHorizontal } from 'lucide-react'
import styles from './AiCard.module.css'

export default function AiCard({
  tool, onEdit, onDelete, onImageUpload,
  dragging, dragOver, onDragStart, onDragOver, onDrop, onDragEnd,
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState(null)
  const fileRef = useRef()

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    setUploadErr(null)
    try {
      await onImageUpload(tool.id, file)
    } catch (err) {
      setUploadErr(err.message || 'Erro ao enviar imagem')
    } finally {
      setUploading(false)
    }
  }

  const hasImg = Boolean(tool.img)

  const cardClass = [
    styles.card,
    dragging ? styles.dragging : '',
    dragOver ? styles.dragOver : '',
  ].join(' ')

  return (
    <div
      className={cardClass}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div className={styles.grip}><GripHorizontal size={13} /></div>

      {/* Imagem quadrada */}
      <div
        className={styles.imgArea}
        onClick={() => !uploading && fileRef.current.click()}
        title={hasImg ? 'Trocar imagem' : 'Subir imagem'}
      >
        {uploading ? (
          <div className={styles.imgPlaceholder}>
            <span className={styles.uploadingDot}>↑</span>
            <span>Enviando…</span>
          </div>
        ) : hasImg ? (
          <img src={tool.img} alt={tool.name} className={styles.img} />
        ) : (
          <div className={styles.imgPlaceholder}>
            <ImagePlus size={22} strokeWidth={1.5} />
            <span>{uploadErr ? 'Erro — tentar de novo' : 'Subir logo'}</span>
          </div>
        )}
        {!uploading && (
          <div className={styles.imgOverlay}>
            <ImagePlus size={14} strokeWidth={1.5} />
            <span>{hasImg ? 'Trocar imagem' : 'Subir imagem'}</span>
          </div>
        )}
      </div>
      <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

      <div className={styles.body}>
        <div className={styles.name}>{tool.name}</div>
        {tool.description && <p className={styles.description}>{tool.description}</p>}
      </div>

      <div className={styles.footer}>
        {tool.url ? (
          <a
            className={styles.openBtn}
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink size={13} /> Abrir ferramenta
          </a>
        ) : (
          <span className={styles.noUrl}>Sem link</span>
        )}
        <button className={styles.iconBtn} onClick={() => onEdit(tool)} title="Editar">
          <Pencil size={13} />
        </button>
        <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => onDelete(tool.id)} title="Excluir">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}
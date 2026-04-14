import { useRef, useState } from 'react'
import { Copy, Check, Pencil, Trash2, ImagePlus, GripHorizontal } from 'lucide-react'
import styles from './PromptCard.module.css'

const ASPECT_CSS = { '9:16': '9/16', '16:9': '16/9', '1:1': '1/1' }

export default function PromptCard({
  prompt, cat, sub, onEdit, onDelete, onImageUpload, onImageClick,
  dragging, dragOver, onDragStart, onDragOver, onDrop, onDragEnd,
}) {
  const [copied, setCopied]       = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState(null)
  const fileRef = useRef()

  function copy() {
    navigator.clipboard.writeText(prompt.text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    setUploadErr(null)
    try {
      await onImageUpload(prompt.id, file)
    } catch (err) {
      setUploadErr(err.message || 'Erro ao enviar imagem')
    } finally {
      setUploading(false)
    }
  }

  const ratio = ASPECT_CSS[prompt.aspect] || '1/1'
  const hasImg = Boolean(prompt.img)

  const cardClass = [
    styles.card,
    dragging  ? styles.dragging : '',
    dragOver  ? styles.dragOver : '',
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
      {/* Área da imagem */}
      <div
        className={styles.imgArea}
        style={{ aspectRatio: ratio }}
        onClick={() => hasImg ? onImageClick(prompt) : fileRef.current.click()}
      >
        {uploading
          ? <div className={styles.imgPlaceholder}><span className={styles.uploadingDot}>↑</span><span>Enviando…</span></div>
          : hasImg
            ? <img src={prompt.img} alt={prompt.name} className={styles.img} />
            : (
              <div className={styles.imgPlaceholder}>
                <ImagePlus size={22} strokeWidth={1.5} />
                <span>{uploadErr ? 'Erro — tentar de novo' : 'Subir exemplo'}</span>
              </div>
            )
        }
        {!uploading && (
          <div className={styles.imgOverlay}>
            {hasImg
              ? (
                <button
                  className={styles.changeBtn}
                  onClick={e => { e.stopPropagation(); fileRef.current.click() }}
                >
                  <ImagePlus size={13} /> Trocar imagem
                </button>
              )
              : (
                <>
                  <ImagePlus size={16} strokeWidth={1.5} />
                  <span>Subir imagem</span>
                </>
              )
            }
          </div>
        )}
      </div>
      <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

      <div className={styles.body}>
        <div className={styles.meta}>
          {cat && <span className={styles.tag}>{cat.icon} {cat.name}</span>}
          {sub && <span className={styles.tag2}>{sub.name}</span>}
          <span className={styles.aspectTag}>{prompt.aspect || '1:1'}</span>
        </div>
        <div className={styles.name}>{prompt.name}</div>
        <p className={styles.text}>{prompt.text}</p>
      </div>

      <div className={styles.footer}>
        <button className={`${styles.copyBtn} ${copied ? styles.copied : ''}`} onClick={copy}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copiado!' : 'Copiar prompt'}
        </button>
        <button className={styles.iconBtn} onClick={() => onEdit(prompt)} title="Editar">
          <Pencil size={13} />
        </button>
        <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => onDelete(prompt.id)} title="Excluir">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { UpdateInfo } from '../../../shared/types'

interface Props {
  updateInfo: UpdateInfo
  onDownload: () => void
  onDismiss: () => void
}

export function UpdateNotification({ updateInfo, onDownload, onDismiss }: Props) {
  const { t } = useTranslation()

  const handleDownload = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      onDownload()
    },
    [onDownload]
  )

  const handleDismiss = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      onDismiss()
    },
    [onDismiss]
  )

  return (
    <div style={styles.bar}>
      <span style={styles.text}>
        {t('update.available', { version: updateInfo.latestVersion })}
      </span>
      <div style={styles.actions}>
        <button style={styles.downloadButton} onClick={handleDownload}>
          {t('button.download')}
        </button>
        <button style={styles.dismissButton} onClick={handleDismiss}>
          ✕
        </button>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  bar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    backgroundColor: '#3D3D3D',
    color: '#FFFFFF',
    fontSize: '13px',
    zIndex: 9999
  },
  text: {
    flex: 1
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  downloadButton: {
    padding: '5px 14px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#FFFFFF',
    backgroundColor: '#8B7355',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  dismissButton: {
    padding: '4px 8px',
    fontSize: '12px',
    color: '#9B9B9B',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer'
  }
}

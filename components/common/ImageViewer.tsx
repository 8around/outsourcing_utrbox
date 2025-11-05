'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { X, ZoomIn, ZoomOut } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ImageViewerProps {
  src: string
  alt: string
  open: boolean
  onClose: () => void
}

export function ImageViewer({ src, alt, open, onClose }: ImageViewerProps) {
  const [zoom, setZoom] = useState(1)

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5))
  }

  const handleClose = () => {
    setZoom(1)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="h-[90vh] max-w-5xl p-0">
        <div className="relative h-full w-full bg-black">
          {/* Controls */}
          <div className="absolute right-4 top-4 z-10 flex gap-2">
            <Button variant="secondary" size="icon" onClick={handleZoomOut} disabled={zoom <= 0.5}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon" onClick={handleZoomIn} disabled={zoom >= 3}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Image */}
          <div className="flex h-full w-full items-center justify-center overflow-auto p-8">
            <img
              src={src}
              alt={alt}
              style={{
                transform: `scale(${zoom})`,
                transition: 'transform 0.2s ease-in-out',
              }}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {/* Zoom indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-black/70 px-3 py-1 text-sm text-white">
            {Math.round(zoom * 100)}%
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

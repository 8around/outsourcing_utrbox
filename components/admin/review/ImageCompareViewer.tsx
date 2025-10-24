'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react'
import Image from 'next/image'

interface ImageCompareViewerProps {
  originalImageUrl: string
  detectedImageUrl: string
}

export function ImageCompareViewer({
  originalImageUrl,
  detectedImageUrl,
}: ImageCompareViewerProps) {
  const [zoom, setZoom] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50))
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div className="space-y-4">
      {/* 줌 컨트롤 */}
      <div className="flex items-center justify-between rounded-lg border bg-white p-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 50}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="min-w-[60px] text-center text-sm font-medium">{zoom}%</span>
          <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 200}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* 이미지 비교 */}
      <div
        className={`grid gap-4 ${
          isFullscreen ? 'h-[calc(100vh-300px)]' : 'h-[500px]'
        } md:grid-cols-2`}
      >
        {/* 원본 이미지 */}
        <div className="overflow-auto rounded-lg border bg-gray-100">
          <div className="p-4">
            <div className="mb-2 text-sm font-semibold text-gray-700">원본 이미지</div>
            <div className="relative min-h-[400px] overflow-hidden rounded border bg-white">
              <Image
                src={originalImageUrl}
                alt="Original"
                width={(800 * zoom) / 100}
                height={(600 * zoom) / 100}
                className="mx-auto object-contain"
              />
            </div>
          </div>
        </div>

        {/* 발견 이미지 */}
        <div className="overflow-auto rounded-lg border bg-gray-100">
          <div className="p-4">
            <div className="mb-2 text-sm font-semibold text-gray-700">발견 이미지</div>
            <div className="relative min-h-[400px] overflow-hidden rounded border bg-white">
              <Image
                src={detectedImageUrl}
                alt="Detected"
                width={(800 * zoom) / 100}
                height={(600 * zoom) / 100}
                className="mx-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

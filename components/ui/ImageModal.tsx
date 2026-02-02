'use client'

import Image from 'next/image'

type Props = {
  src: string
  onClose: () => void
}

export default function ImageModal({ src, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white text-2xl"
        >
          ✕
        </button>

        <Image
          src={src}
          alt="preview"
          width={1200}
          height={1200}
          className="object-contain max-h-[90vh] rounded-lg"
        />
      </div>
    </div>
  )
}

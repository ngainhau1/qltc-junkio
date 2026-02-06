import { X } from "lucide-react"
import { Button } from "./button"
import { createPortal } from "react-dom"
import { useEffect, useState } from "react"

export function Modal({ isOpen, onClose, title, children }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Prevent scrolling when modal is open
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!isOpen || !mounted) return null

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in">
            <div className="w-full max-w-md bg-white rounded-lg shadow-xl border p-6 relative">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                {children}
            </div>
        </div>,
        document.body
    )
}

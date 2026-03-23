import { X } from "lucide-react"
import { Button } from "./button"
import { createPortal } from "react-dom"
import { useEffect } from "react"

export function Modal({ isOpen, onClose, title, children, contentTestId }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col justify-end md:items-center md:justify-center bg-black/50 backdrop-blur-sm animate-in fade-in p-0 md:p-4 md:duration-200">
            <div
                role="dialog"
                aria-modal="true"
                data-testid={contentTestId}
                className="w-full md:max-w-md bg-background md:rounded-lg rounded-t-2xl shadow-xl border border-border p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] relative animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:zoom-in-95 max-h-[85dvh] overflow-y-auto overflow-x-hidden safe-area-pb"
            >
                {/* Drag Handle for Mobile */}
                <div className="w-full flex justify-center mb-4 md:hidden">
                    <div className="h-1.5 w-12 rounded-full bg-muted-foreground/20"></div>
                </div>

                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                {children}
            </div>
        </div>,
        document.body
    )
}

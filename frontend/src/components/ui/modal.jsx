import { X } from "lucide-react"
import { Button } from "./button"
import { createPortal } from "react-dom"
import { useEffect } from "react"
import { cn } from "@/lib/utils"

export function Modal({ isOpen, onClose, title, children, contentTestId, contentClassName }) {
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
        <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/50 p-0 backdrop-blur-sm animate-in fade-in sm:p-4 md:items-center md:justify-center md:duration-200">
            <div
                role="dialog"
                aria-modal="true"
                data-testid={contentTestId}
                className={cn(
                    "relative max-h-[90dvh] w-full overflow-y-auto overflow-x-hidden rounded-t-2xl border border-border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl animate-in slide-in-from-bottom-full sm:max-w-lg sm:rounded-2xl sm:p-6 md:slide-in-from-bottom-0 md:zoom-in-95",
                    contentClassName
                )}
            >
                {/* Drag Handle for Mobile */}
                <div className="w-full flex justify-center mb-4 md:hidden">
                    <div className="h-1.5 w-12 rounded-full bg-muted-foreground/20"></div>
                </div>

                <div className="mb-4 flex items-start justify-between gap-3">
                    <h2 className="min-w-0 pr-2 text-lg font-semibold sm:text-xl">{title}</h2>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 shrink-0 rounded-full">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                {children}
            </div>
        </div>,
        document.body
    )
}

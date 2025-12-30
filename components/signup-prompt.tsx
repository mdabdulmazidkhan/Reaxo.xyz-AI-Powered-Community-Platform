"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import Image from "next/image"
import { AuthModal } from "@/components/auth-modal"

export function SignupPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (user) return

    const dismissed = localStorage.getItem("signup_prompt_dismissed")
    if (dismissed) return

    const timer = setTimeout(() => {
      setShowPrompt(true)
    }, 5000)

    return () => clearTimeout(timer)
  }, [user, isLoading])

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("signup_prompt_dismissed", Date.now().toString())
  }

  const handleSignUp = () => {
    setShowPrompt(false)
    setTimeout(() => {
      setShowAuthModal(true)
    }, 100)
  }

  const handleSignIn = () => {
    setShowPrompt(false)
    setTimeout(() => {
      setShowAuthModal(true)
    }, 100)
  }

  return (
    <>
      <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-[360px] p-0 overflow-hidden border border-border/50 bg-background shadow-lg rounded-2xl"
        >
          <div className="relative">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-full hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Content */}
            <div className="px-8 pt-12 pb-8 flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-full bg-white border border-border flex items-center justify-center overflow-hidden mb-6 shadow-sm">
                <Image src="/reaxo-logo.png" alt="Reaxo" width={60} height={60} className="object-contain" />
              </div>

              <div className="flex flex-col items-center gap-2 mb-6">
                <span className="px-2.5 py-1 rounded-full bg-[#00bf62] text-white text-xs font-semibold uppercase tracking-wide">
                  Beta
                </span>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Built for</span>
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <div className="h-5 w-5 rounded-full bg-[#1a1a3e] flex items-center justify-center overflow-hidden">
                      <Image src="/images/image.png" alt="Foru.ms" width={12} height={12} className="object-contain" />
                    </div>
                    <span>Foru.ms</span>
                  </div>
                  <span>×</span>
                  <span className="font-medium text-foreground">v0</span>
                  <span>Hackathon</span>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl font-semibold text-foreground mb-2">Welcome to Reaxo</h2>
              <p className="text-sm text-muted-foreground mb-8">Create an account to get started.</p>

              {/* Buttons */}
              <div className="w-full space-y-3">
                <Button
                  onClick={handleSignUp}
                  className="w-full h-10 text-sm font-medium bg-[#00bf62] hover:bg-[#00a855] text-white"
                >
                  Create Account
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSignIn}
                  className="w-full h-10 text-sm font-medium bg-transparent"
                >
                  Sign In
                </Button>
              </div>

              {/* Maybe later */}
              <button
                onClick={handleDismiss}
                className="mt-5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  )
}

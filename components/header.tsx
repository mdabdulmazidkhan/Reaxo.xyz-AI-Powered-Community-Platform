"use client"

import { useState } from "react"
import { Bell, Menu, X, Plus, LogIn, LayoutDashboard, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAuth } from "@/lib/auth-context"
import { AuthModal } from "@/components/auth-modal"
import { NewThreadModal } from "@/components/new-thread-modal"
import { ThemeToggle } from "@/components/theme-toggle"
import { SearchCommand } from "@/components/search-command"
import Link from "next/link"
import Image from "next/image"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [newThreadModalOpen, setNewThreadModalOpen] = useState(false)

  const { user, isLoading, logout } = useAuth()

  const handleNewThread = () => {
    if (!user) {
      setAuthModalOpen(true)
    } else {
      setNewThreadModalOpen(true)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/reaxo-logo.png" alt="Reaxo" width={36} height={36} className="rounded-lg" />
            <span className="text-xl font-semibold tracking-tight">Reaxo</span>
          </Link>

          <div className="hidden flex-1 max-w-xl md:block">
            <SearchCommand />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Search className="h-5 w-5" />
            </Button>

            <ThemeToggle />

            <Button className="hidden gap-2 sm:flex" onClick={handleNewThread}>
              <Plus className="h-4 w-4" />
              New Thread
            </Button>

            {!isLoading && !user && (
              <Button variant="outline" className="gap-2 bg-transparent" onClick={() => setAuthModalOpen(true)}>
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            )}

            {user && (
              <>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-5 w-5" />
                  </Link>
                </Button>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                        <h4 className="font-semibold">Notifications</h4>
                      </div>
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                          <Bell className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">No notifications</p>
                        <p className="text-xs text-muted-foreground mt-1">You're all caught up! Check back later.</p>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 px-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.displayName} />
                        <AvatarFallback>{user.displayName?.[0] || user.username[0]}</AvatarFallback>
                      </Avatar>
                      <span className="hidden text-sm font-medium lg:inline-block">{user.displayName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center gap-3 p-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.displayName} />
                        <AvatarFallback>{user.displayName?.[0] || user.username[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.displayName}</span>
                        <span className="text-xs text-muted-foreground">@{user.username}</span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                    <DropdownMenuItem>My Threads</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={logout}>
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-border p-4 md:hidden">
            <div className="mb-4">
              <SearchCommand />
            </div>
            <Button className="w-full gap-2" onClick={handleNewThread}>
              <Plus className="h-4 w-4" />
              New Thread
            </Button>
          </div>
        )}
      </header>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      <NewThreadModal open={newThreadModalOpen} onOpenChange={setNewThreadModalOpen} />
    </>
  )
}

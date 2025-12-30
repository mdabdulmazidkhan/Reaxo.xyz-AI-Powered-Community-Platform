"use client"

import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bot, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface MentionItem {
  id: string
  username: string
  avatarUrl?: string
  isAI?: boolean
}

interface MentionListProps {
  items: MentionItem[]
  command: (item: MentionItem) => void
}

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = items[index]
    if (item) {
      command(item)
    }
  }

  const upHandler = () => {
    setSelectedIndex((selectedIndex + items.length - 1) % items.length)
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % items.length)
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  useEffect(() => {
    setSelectedIndex(0)
  }, [items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        upHandler()
        return true
      }

      if (event.key === "ArrowDown") {
        downHandler()
        return true
      }

      if (event.key === "Enter") {
        enterHandler()
        return true
      }

      return false
    },
  }))

  if (items.length === 0) {
    return null
  }

  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg overflow-hidden min-w-[200px]">
      {items.map((item, index) => (
        <button
          key={item.id}
          onClick={() => selectItem(index)}
          className={cn(
            "flex items-center gap-2 w-full px-3 py-2 text-left text-sm transition-colors",
            index === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted",
          )}
        >
          {item.isAI ? (
            <div
              className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center",
                item.id === "image" ? "bg-purple-500/10" : "bg-primary/10",
              )}
            >
              {item.id === "image" ? (
                <ImageIcon className="h-4 w-4 text-purple-500" />
              ) : (
                <Bot className="h-4 w-4 text-primary" />
              )}
            </div>
          ) : (
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={item.avatarUrl || `/placeholder.svg?height=24&width=24&query=avatar ${item.username}`}
              />
              <AvatarFallback className="text-xs">{item.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
          )}
          <span className="font-medium">{item.username}</span>
          {item.isAI && (
            <span className="text-xs text-muted-foreground ml-auto">
              {item.id === "image" ? "Image Generator" : "AI Assistant"}
            </span>
          )}
        </button>
      ))}
    </div>
  )
})

MentionList.displayName = "MentionList"

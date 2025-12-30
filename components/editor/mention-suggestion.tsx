"use client"

import { ReactRenderer } from "@tiptap/react"
import tippy, { type Instance as TippyInstance } from "tippy.js"
import { MentionList, type MentionItem, type MentionListRef } from "./mention-list"

// AI user is always available
const AI_USER: MentionItem = {
  id: "ai",
  username: "ai",
  isAI: true,
}

const IMAGE_AI: MentionItem = {
  id: "image",
  username: "image",
  isAI: true,
}

// Fetch users from API (mock for now, can be connected to foru.ms users API)
const fetchUsers = async (query: string): Promise<MentionItem[]> => {
  const results: MentionItem[] = []

  if ("ai".startsWith(query.toLowerCase())) {
    results.push(AI_USER)
  }

  if ("image".startsWith(query.toLowerCase())) {
    results.push(IMAGE_AI)
  }

  // In a real implementation, fetch from your users API
  const mockUsers: MentionItem[] = [
    { id: "user-1", username: "john_doe", avatarUrl: "/john-avatar.png" },
    { id: "user-2", username: "jane_smith", avatarUrl: "/jane-avatar.jpg" },
    { id: "user-3", username: "dev_master", avatarUrl: "/dev-avatar.jpg" },
    { id: "user-4", username: "tech_guru", avatarUrl: "/guru-avatar.jpg" },
  ]

  const filteredUsers = mockUsers.filter((user) => user.username.toLowerCase().startsWith(query.toLowerCase()))

  return [...results, ...filteredUsers].slice(0, 6)
}

export const mentionSuggestion = {
  items: async ({ query }: { query: string }): Promise<MentionItem[]> => {
    return fetchUsers(query)
  },

  render: () => {
    let component: ReactRenderer<MentionListRef> | null = null
    let popup: TippyInstance[] | null = null

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        })

        if (!props.clientRect) {
          return
        }

        popup = tippy("body", {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
        })
      },

      onUpdate(props: any) {
        component?.updateProps(props)

        if (!props.clientRect) {
          return
        }

        popup?.[0]?.setProps({
          getReferenceClientRect: props.clientRect,
        })
      },

      onKeyDown(props: any) {
        if (props.event.key === "Escape") {
          popup?.[0]?.hide()
          return true
        }

        return component?.ref?.onKeyDown(props) ?? false
      },

      onExit() {
        popup?.[0]?.destroy()
        component?.destroy()
      },
    }
  },
}

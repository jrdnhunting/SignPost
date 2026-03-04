"use client"
import { useState } from "react"

interface InventoryTabsProps {
  stockTab: React.ReactNode
  clientAssetsTab: React.ReactNode
}

export function InventoryTabs({ stockTab, clientAssetsTab }: InventoryTabsProps) {
  const [tab, setTab] = useState<"stock" | "client_assets">("stock")

  return (
    <div>
      <div className="flex border-b mb-6">
        <button
          onClick={() => setTab("stock")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "stock"
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Stock
        </button>
        <button
          onClick={() => setTab("client_assets")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "client_assets"
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Client Assets
        </button>
      </div>

      {tab === "stock" ? stockTab : clientAssetsTab}
    </div>
  )
}

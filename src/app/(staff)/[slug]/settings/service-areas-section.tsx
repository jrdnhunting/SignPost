"use client"

import dynamic from "next/dynamic"

const ServiceAreaMap = dynamic(() => import("./service-area-map"), { ssr: false })

interface SerializedServiceArea {
  id: string
  name: string
  polygon: object
  pricingAdjustment: string | null
  technicians: { userId: string; user: { id: string; name: string } }[]
}

interface Technician {
  id: string
  name: string
}

interface Props {
  orgId: string
  orgSlug: string
  initialAreas: SerializedServiceArea[]
  technicians: Technician[]
}

export function ServiceAreasSection({ orgId, orgSlug, initialAreas, technicians }: Props) {
  return (
    <ServiceAreaMap
      orgId={orgId}
      orgSlug={orgSlug}
      initialAreas={initialAreas}
      technicians={technicians}
    />
  )
}

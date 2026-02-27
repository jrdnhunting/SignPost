export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"

export default async function SlugRootPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`/${slug}/dashboard`)
}

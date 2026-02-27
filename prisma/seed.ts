import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database...")

  // Create organization
  const org = await prisma.organization.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: "Demo Sign Co",
      slug: "demo",
      plan: "starter",
    },
  })
  console.log(`Org: ${org.name} (${org.slug})`)

  // Create staff users
  const adminHash = await bcrypt.hash("password123", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      email: "admin@demo.com",
      name: "Demo Admin",
      passwordHash: adminHash,
    },
  })

  const dispatcherHash = await bcrypt.hash("password123", 12)
  const dispatcher = await prisma.user.upsert({
    where: { email: "dispatcher@demo.com" },
    update: {},
    create: {
      email: "dispatcher@demo.com",
      name: "Demo Dispatcher",
      passwordHash: dispatcherHash,
    },
  })

  const techHash = await bcrypt.hash("password123", 12)
  const tech = await prisma.user.upsert({
    where: { email: "tech@demo.com" },
    update: {},
    create: {
      email: "tech@demo.com",
      name: "Demo Technician",
      passwordHash: techHash,
    },
  })

  // Memberships
  await prisma.membership.upsert({
    where: { organizationId_userId_role: { organizationId: org.id, userId: admin.id, role: "ADMIN" } },
    update: {},
    create: { organizationId: org.id, userId: admin.id, role: "ADMIN" },
  })
  await prisma.membership.upsert({
    where: { organizationId_userId_role: { organizationId: org.id, userId: dispatcher.id, role: "DISPATCHER" } },
    update: {},
    create: { organizationId: org.id, userId: dispatcher.id, role: "DISPATCHER" },
  })
  await prisma.membership.upsert({
    where: { organizationId_userId_role: { organizationId: org.id, userId: tech.id, role: "TECHNICIAN" } },
    update: {},
    create: { organizationId: org.id, userId: tech.id, role: "TECHNICIAN" },
  })

  console.log("Staff users created: admin@demo.com, dispatcher@demo.com, tech@demo.com")

  // Create client
  const client = await prisma.client.create({
    data: {
      organizationId: org.id,
      firstName: "Jane",
      lastName: "Acme",
      companyName: "Acme Retail",
      email: "jane@acme.com",
      phone: "(555) 123-4567",
    },
  })

  // Seed a payment method
  await prisma.clientPaymentMethod.create({
    data: {
      clientId: client.id,
      type: "credit_card",
      label: "Visa ••••4242",
      isDefault: true,
    },
  })

  // Client portal user
  const clientHash = await bcrypt.hash("password123", 12)
  const clientUser = await prisma.clientUser.upsert({
    where: { email: "client@acme.com" },
    update: {},
    create: {
      clientId: client.id,
      email: "client@acme.com",
      name: "Jane Acme",
      passwordHash: clientHash,
    },
  })
  console.log("Client: Jane Acme (Acme Retail) / client@acme.com")

  // Helper: create a work order with atomic orderId assignment
  async function createSeedWO(data: Omit<Parameters<typeof prisma.workOrder.create>[0]["data"], "orderId">) {
    return prisma.$transaction(async (tx) => {
      const updatedOrg = await tx.organization.update({
        where: { id: org.id },
        data: { nextOrderSeq: { increment: 1 } },
        select: { nextOrderSeq: true },
      })
      const orderId = updatedOrg.nextOrderSeq - 1
      return tx.workOrder.create({ data: { ...data, orderId } as any })
    })
  }

  // Sample work orders (different addresses — no dedup)
  const wo1 = await createSeedWO({
    organizationId: org.id,
    clientId: client.id,
    createdById: dispatcher.id,
    ownerId: admin.id,
    orderNotes: "Install 4×8 aluminum monument sign at front entrance.",
    addressLine1: "100 Main Street",
    city: "Springfield",
    state: "IL",
    postalCode: "62701",
    country: "US",
    locationNotes: "Gate code: 1234. Park in back lot.",
    priority: "HIGH",
    status: "CONFIRMED",
    scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  })

  const wo2 = await createSeedWO({
    organizationId: org.id,
    clientId: client.id,
    submittedById: clientUser.id,
    ownerId: admin.id,
    orderNotes: "Install channel letter signage above storefront.",
    addressLine1: "450 Oak Avenue",
    addressLine2: "Suite 12",
    city: "Shelbyville",
    state: "IL",
    postalCode: "62565",
    country: "US",
    priority: "NORMAL",
    status: "PENDING",
  })

  const wo3 = await createSeedWO({
    organizationId: org.id,
    clientId: client.id,
    createdById: admin.id,
    ownerId: admin.id,
    orderNotes: "Remove old directional signs and install new wayfinding package.",
    addressLine1: "2200 Riverside Drive",
    city: "Capital City",
    state: "IL",
    postalCode: "62702",
    country: "US",
    priority: "NORMAL",
    status: "COMPLETED",
    completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  })

  console.log("Work orders created: 3 sample WOs")

  // Assign technician to wo1
  await prisma.assignment.create({
    data: {
      workOrderId: wo1.id,
      userId: tech.id,
      status: "ACCEPTED",
    },
  })

  // Work order items for wo1
  await prisma.workOrderItem.createMany({
    data: [
      {
        workOrderId: wo1.id,
        description: "4×8 Aluminum Monument Sign",
        quantity: 1,
        unitPrice: 1200.0,
        sortOrder: 0,
      },
      {
        workOrderId: wo1.id,
        description: "Installation Labor (4 hrs)",
        quantity: 4,
        unitPrice: 85.0,
        sortOrder: 1,
      },
      {
        workOrderId: wo1.id,
        description: "Permit Pulling",
        quantity: 1,
        unitPrice: 150.0,
        sortOrder: 2,
      },
    ],
  })

  // Create invoice for wo3 (completed)
  const invoice = await prisma.invoice.create({
    data: {
      organizationId: org.id,
      clientId: client.id,
      workOrderId: wo3.id,
      invoiceNumber: "INV-2026-0001",
      status: "PARTIAL",
      issuedAt: new Date(),
      dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotal: 950.0,
      total: 950.0,
    },
  })

  await prisma.invoiceLineItem.createMany({
    data: [
      {
        invoiceId: invoice.id,
        description: "Directional Sign Package (4 signs)",
        quantity: 4,
        unitPrice: 175.0,
        amount: 700.0,
        sortOrder: 0,
      },
      {
        invoiceId: invoice.id,
        description: "Installation & Removal Labor",
        quantity: 3,
        unitPrice: 85.0,
        amount: 255.0,
        sortOrder: 1,
      },
    ],
  })

  await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      amount: 500.0,
      method: "CHECK",
      reference: "CHK-1042",
      paidAt: new Date(),
    },
  })

  // Inventory items
  await prisma.inventoryItemType.createMany({
    data: [
      {
        organizationId: org.id,
        name: "4×8 Aluminum Sheet",
        sku: "ALU-48",
        unit: "sheet",
        currentStock: 12,
        reorderPoint: 3,
      },
      {
        organizationId: org.id,
        name: "Channel Letter 'A'",
        sku: "CHL-A",
        unit: "each",
        currentStock: 2,
        reorderPoint: 5,
      },
      {
        organizationId: org.id,
        name: "Vinyl Roll – White 24\"",
        sku: "VNL-W24",
        unit: "roll",
        currentStock: 8,
        reorderPoint: 2,
      },
    ],
  })

  console.log("Inventory items created")
  console.log("\n✅ Seed complete!")
  console.log("\nLogin credentials:")
  console.log("  Staff Admin:     admin@demo.com / password123  →  /demo/dashboard")
  console.log("  Staff Dispatch:  dispatcher@demo.com / password123")
  console.log("  Technician:      tech@demo.com / password123  →  /technician")
  console.log("  Client Portal:   client@acme.com / password123  →  /portal/<clientId>")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

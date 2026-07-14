import {PrismaClient} from "@prisma/client";
import bcrypt from "bcryptjs";

// === CONFIGURABLE VALUES ===
// Seeds 6 realistic Galapagos packages, one admin user, and a few promotions.
// Images use real picsum.photos URLs (no AI-generated SVGs).

const prisma = new PrismaClient();

const packages = [
  {
    slug: "santa-cruz-highlands",
    title: "Santa Cruz Highlands Escape",
    summary:
      "Giant tortoises, lava tunnels, and the lively town of Puerto Ayora on central Santa Cruz.",
    description:
      "Spend five days exploring the highlands of Santa Cruz: walk among wild giant tortoises in their natural habitat, descend into ancient lava tunnels, and snorkel at Tortuga Bay. Evenings are spent in family-run lodges with Galapagueno hospitality.",
    priceInCents: 135000,
    currency: "USD",
    durationDays: 5,
    location: "Santa Cruz Island",
    maxGuests: 12,
    featured: true,
    images: [
      "https://picsum.photos/seed/santa-cruz-1/640/480",
      "https://picsum.photos/seed/santa-cruz-2/640/480",
    ],
  },
  {
    slug: "isabela-island-adventure",
    title: "Isabela Island Adventure",
    summary:
      "Volcano hikes, flamingo lagoons, and the best snorkeling with sea turtles and penguins.",
    description:
      "Six days on the largest and wildest island. Trek the Sierra Negra volcano, bike to Wall of Tears, kayak through mangroves, and snorkel with penguins at Concha de Perla. A true off-the-beaten-path experience.",
    priceInCents: 168000,
    currency: "USD",
    durationDays: 6,
    location: "Isabela Island",
    maxGuests: 10,
    featured: true,
    images: [
      "https://picsum.photos/seed/isabela-1/640/480",
      "https://picsum.photos/seed/isabela-2/640/480",
    ],
  },
  {
    slug: "galapagos-snorkeling-tour",
    title: "Galapagos Snorkeling Tour",
    summary:
      "A water-first expedition to the most vibrant reefs and bays of the archipelago.",
    description:
      "Five days built around the ocean: Los Tuneles, Devil's Crown, and Gardner Bay. Swim alongside sea lions, reef sharks, rays, and marine iguanas. Equipment and guided sessions included for all levels.",
    priceInCents: 149000,
    currency: "USD",
    durationDays: 5,
    location: "Multiple islands",
    maxGuests: 14,
    featured: true,
    images: [
      "https://picsum.photos/seed/snorkel-1/640/480",
      "https://picsum.photos/seed/snorkel-2/640/480",
    ],
  },
  {
    slug: "darwin-voyage",
    title: "The Darwin Voyage",
    summary:
      "An eight-day expedition cruise following Darwin's route across the central islands.",
    description:
      "Sail aboard a classic motor yacht through Santa Cruz, Floreana, Española, and Genovesa. Daily landings with naturalist guides, night lectures, and a panga ride through mangroves teeming with life.",
    priceInCents: 298000,
    currency: "USD",
    durationDays: 8,
    location: "Central Islands Cruise",
    maxGuests: 16,
    featured: true,
    images: [
      "https://picsum.photos/seed/darwin-1/640/480",
      "https://picsum.photos/seed/darwin-2/640/480",
    ],
  },
  {
    slug: "family-discovery",
    title: "Family Discovery Expedition",
    summary:
      "A relaxed, kid-friendly week of gentle wildlife encounters and beach days.",
    description:
      "Designed for families: tide-pool explorations, baby tortoise nurseries, and calm swimming spots. Includes a dedicated family guide and flexible daily pacing.",
    priceInCents: 185000,
    currency: "USD",
    durationDays: 7,
    location: "Santa Cruz & San Cristobal",
    maxGuests: 18,
    featured: false,
    images: [
      "https://picsum.photos/seed/family-1/640/480",
      "https://picsum.photos/seed/family-2/640/480",
    ],
  },
  {
    slug: "photography-expedition",
    title: "Wildlife Photography Expedition",
    summary:
      "A guide-led trip optimized for golden-hour light and rare species.",
    description:
      "Ten days with a professional wildlife photographer. Access to less-visited sites, early landings, and post-processing workshops. Suitable for enthusiasts and serious shooters.",
    priceInCents: 345000,
    currency: "USD",
    durationDays: 10,
    location: "Multi-island",
    maxGuests: 8,
    featured: false,
    images: [
      "https://picsum.photos/seed/photo-1/640/480",
      "https://picsum.photos/seed/photo-2/640/480",
    ],
  },
];

const promotions = [
  {
    code: "EARLYBIRD10",
    label: "Early Bird 10%",
    discountPercent: 10,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
    active: true,
  },
  {
    code: "FAMILY15",
    label: "Family Group 15%",
    discountPercent: 15,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
    active: true,
  },
  {
    code: "WELCOME5",
    label: "Welcome 5%",
    discountPercent: 5,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-06-30"),
    active: false,
  },
];

async function main() {
  console.log("Seeding database...");

  // Admin user (password hashed with bcryptjs).
  const passwordHash = await bcrypt.hash("Password123!", 10);
  await prisma.user.upsert({
    where: {email: "admin@galapagos.example"},
    update: {},
    create: {
      email: "admin@galapagos.example",
      name: "Site Admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  // Packages (clear existing images to avoid dupes on re-seed).
  for (const p of packages) {
    const {images, ...data} = p;
    await prisma.package.upsert({
      where: {slug: data.slug},
      update: {
        title: data.title,
        summary: data.summary,
        description: data.description,
        priceInCents: data.priceInCents,
        durationDays: data.durationDays,
        location: data.location,
        maxGuests: data.maxGuests,
        featured: data.featured,
        images: {
          deleteMany: {},
          create: images.map((url, i) => ({
            url,
            alt: `${data.title} image ${i + 1}`,
            sortOrder: i,
          })),
        },
      },
      create: {
        ...data,
        images: {
          create: images.map((url, i) => ({
            url,
            alt: `${data.title} image ${i + 1}`,
            sortOrder: i,
          })),
        },
      },
    });
  }

  // Promotions.
  for (const promo of promotions) {
    await prisma.promotion.upsert({
      where: {code: promo.code},
      update: promo,
      create: promo,
    });
  }

  const [pkgCount, userCount, promoCount] = await Promise.all([
    prisma.package.count(),
    prisma.user.count(),
    prisma.promotion.count(),
  ]);
  console.log(
    `Seeded: ${pkgCount} packages, ${userCount} users, ${promoCount} promotions.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.asthahairexpert.com";

// Static pages with their priorities and change frequencies
const staticRoutes: MetadataRoute.Sitemap = [
    {
        url: `${BASE_URL}/`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1.0,
    },
    {
        url: `${BASE_URL}/tours`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
    },
];

async function getTourSlugs(): Promise<{ slug: string; updatedAt?: string }[]> {
    try {
        const res = await fetch(`${BASE_URL}/api/protected/tours?limit=1000`, {
            // Revalidate every hour on the server
            next: { revalidate: 3600 },
        });

        if (!res.ok) return [];

        const data = await res.json();
        const tours: { slug: string; status: string; updatedAt?: string }[] =
            data.tours || [];

        // Only include active / published tours in the sitemap
        return tours
            .filter((t) => t.status === "active" && t.slug)
            .map((t) => ({ slug: t.slug, updatedAt: t.updatedAt }));
    } catch {
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const tourSlugs = await getTourSlugs();

    const tourRoutes: MetadataRoute.Sitemap = tourSlugs.map(
        ({ slug, updatedAt }) => ({
            url: `${BASE_URL}/tours/${slug}`,
            lastModified: updatedAt ? new Date(updatedAt) : new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
        })
    );

    return [...staticRoutes, ...tourRoutes];
}

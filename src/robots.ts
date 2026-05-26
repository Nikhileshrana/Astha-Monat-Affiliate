import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.asthahairexpert.com";

    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/protected", "/api/protected"],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
        host: baseUrl,
    };
}

"use client";

import { motion, type Variants } from "motion/react";
import {
  Children,
  type ComponentPropsWithoutRef,
  forwardRef,
  isValidElement,
  useEffect,
  useState,
} from "react";

import { cn } from "@/lib/utils";

// --- Masonry grid (column layout + scroll-in motion) ---

export interface MasonryGridProps extends ComponentPropsWithoutRef<"div"> {
  /** @default 3 */
  columns?: number;
  /** Tailwind spacing units → `columnGap` in rem. @default 4 */
  gap?: number;
}

export const MasonryGrid = forwardRef<HTMLDivElement, MasonryGridProps>(
  ({ className, columns = 3, gap = 4, children, ...props }, ref) => {
    const style = {
      columnCount: columns,
      columnGap: `${gap * 0.25}rem`,
    };

    const cardVariants: Variants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.5,
          ease: [0.33, 1, 0.68, 1],
        },
      },
    };

    return (
      <div
        ref={ref}
        style={style}
        className={cn("w-full", className)}
        {...props}
      >
        {Children.map(children, (child, index) =>
          isValidElement(child) ? (
            <motion.div
              key={child.key ?? `masonry-${index}`}
              className="mb-4 break-inside-avoid"
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {child}
            </motion.div>
          ) : (
            child
          ),
        )}
      </div>
    );
  },
);

MasonryGrid.displayName = "MasonryGrid";

// --- Testimonial data ---

const testimonials = [
  {
    id: "anaam",
    profileImage: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "Anaam Farooq",
    feedback: "Kashmir's Hidden Winter Wonderland",
    mainImage:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&h=1200&q=80",
  },
  {
    id: "neophyte",
    profileImage: "https://randomuser.me/api/portraits/women/44.jpg",
    name: "neophyte_clicker",
    feedback: "Celebrating Diwali Through The Lens",
    mainImage:
      "https://images.unsplash.com/photo-1605292356183-a77d0a9c9d1d?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8RGl3YWxpfGVufDB8fDB8fHww",
  },
  {
    id: "badshah",
    profileImage: "https://randomuser.me/api/portraits/men/56.jpg",
    name: "Badshah1341",
    feedback: "A Sunset Symphony in Gold",
    mainImage:
      "https://images.unsplash.com/photo-1494500764479-0c8f2919a3d8?auto=format&fit=crop&w=800&h=1000&q=80",
  },
  {
    id: "mohsin",
    profileImage: "https://randomuser.me/api/portraits/men/78.jpg",
    name: "mohsinsyasin_",
    feedback: "realme Insider Event Kashmir",
    mainImage:
      "https://images.unsplash.com/photo-1617396900799-f4ec2b43c7ae?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fHdhbGxwYXBlciUyMDRrfGVufDB8fDB8fHww",
  },
  {
    id: "naaz",
    profileImage: "https://randomuser.me/api/portraits/women/68.jpg",
    name: "Naaz khan",
    feedback: "Illuminate the Night with the P3 Pro",
    mainImage:
      "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTF8fG5hdHVyZXxlbnwwfHwwfHx8MA%3D%3D",
  },
  {
    id: "venky",
    profileImage: "https://randomuser.me/api/portraits/women/88.jpg",
    name: "Venky_smile",
    feedback: "Highlights from realme",
    mainImage:
      "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OTh8fG5hdHVyZXxlbnwwfHwwfHx8MA%3D%3D",
  },
  {
    id: "anant",
    profileImage: "https://randomuser.me/api/portraits/men/21.jpg",
    name: "LoserAnant",
    feedback: "14 Pro Series Launch Event Recap",
    mainImage:
      "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Njh8fG5hdHVyZXxlbnwwfHwwfHx8MA%3D%3D",
  },
  {
    id: "isabella",
    profileImage: "https://randomuser.me/api/portraits/women/11.jpg",
    name: "Isabella",
    feedback: "The mountains are calling me.",
    mainImage:
      "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=800&h=1200&q=80",
  },
] as const;

type TestimonialCardData = (typeof testimonials)[number];

function TestimonialCard({
  profileImage,
  name,
  feedback,
  mainImage,
}: TestimonialCardData) {
  return (
    <div className="group relative overflow-hidden rounded-2xl transition-transform duration-300 ease-in-out hover:scale-105">
      {/* biome-ignore lint/performance/noImgElement: masonry heights + runtime onError fallbacks */}
      <img
        src={mainImage}
        alt={feedback}
        className="h-auto w-full object-cover"
        onError={(e) => {
          e.currentTarget.src =
            "https://placehold.co/800x600/1a1a1a/ffffff?text=Image";
        }}
      />
      <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/20 to-transparent" />
      <div className="absolute top-0 left-0 p-4 text-white">
        <div className="mb-2 flex items-center gap-3">
          {/* biome-ignore lint/performance/noImgElement: third-party avatars + onError placeholder */}
          <img
            src={profileImage}
            className="h-8 w-8 rounded-full border-2 border-white/80"
            alt=""
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src =
                "https://placehold.co/40x40/EFEFEF/333333?text=A";
            }}
          />
          <span className="text-sm font-semibold drop-shadow-md">{name}</span>
        </div>
        <p className="text-sm font-medium leading-tight drop-shadow-md">
          {feedback}
        </p>
      </div>
    </div>
  );
}

function getColumns(width: number): number {
  if (width < 640) return 1;
  if (width < 1024) return 2;
  if (width < 1280) return 3;
  return 4;
}

/** Full section: heading + responsive masonry of testimonial cards. */
export default function MasonryGridDemo() {
  const [columns, setColumns] = useState(4);

  useEffect(() => {
    const handleResize = () => {
      setColumns(getColumns(window.innerWidth));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <section className="w-full bg-background p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-8 text-center text-3xl font-bold md:text-4xl">
          Testimonials
        </h2>
        <MasonryGrid columns={columns} gap={4}>
          {testimonials.map((card) => (
            <TestimonialCard key={card.id} {...card} />
          ))}
        </MasonryGrid>
      </div>
    </section>
  );
}

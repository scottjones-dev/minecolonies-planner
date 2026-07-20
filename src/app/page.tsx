import {
  ArrowRight,
  Blocks,
  Castle,
  Check,
  GitFork,
  Grid3X3,
  HeartHandshake,
  Mail,
  MapPinned,
  Radar,
  Route,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { ContactForm } from "@/components/marketing/contact-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { builtInStylePackManifest } from "@/data/built-in-style-packs";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Grid3X3,
    title: "Block & chunk accurate",
    copy: "Place footprints on individual block squares while stronger 16×16 lines keep every build aligned to Minecraft chunks.",
  },
  {
    icon: MapPinned,
    title: "Real square claims",
    copy: "Town Hall and building claims use the same chunk-square rules as the mod, with out-of-bound placements stopped early.",
  },
  {
    icon: Radar,
    title: "Coverage you can trust",
    copy: "Inspect level-aware Guard Tower and Barracks coverage separately from patrol distance, exactly where planning needs it.",
  },
  {
    icon: Route,
    title: "Commutes at a glance",
    copy: "Connect residences to workplaces and spot long worker journeys before a beautiful plan becomes a slow colony.",
  },
  {
    icon: Blocks,
    title: "Source-backed blueprints",
    copy: "Browse every bundled style, category, variant, and upgrade footprint extracted from pinned MineColonies sources.",
  },
  {
    icon: Save,
    title: "Local-first by design",
    copy: "Plans save in your browser. Name them, switch between ideas, and export portable JSON without creating an account.",
  },
] as const;

const stats = [
  {
    value: builtInStylePackManifest.length.toLocaleString(),
    label: "style packs",
  },
  {
    value: builtInStylePackManifest
      .reduce((total, pack) => total + pack.variantCount, 0)
      .toLocaleString(),
    label: "building variants",
  },
  {
    value: builtInStylePackManifest
      .reduce((total, pack) => total + pack.levelCount, 0)
      .toLocaleString(),
    label: "blueprint levels",
  },
  { value: "0", label: "accounts required" },
] as const;

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-300 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]">
        <Castle className="size-5" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block font-semibold tracking-tight text-white">
            MineColonies
          </span>
          <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-emerald-300/70">
            Planner
          </span>
        </span>
      )}
    </span>
  );
}

function PlannerPreview() {
  const buildings = [
    { className: "left-[36%] top-[36%] h-[26%] w-[27%]", label: "Town Hall" },
    { className: "left-[14%] top-[17%] h-[17%] w-[18%]", label: "Residence" },
    { className: "bottom-[12%] left-[16%] h-[19%] w-[21%]", label: "Builder" },
    { className: "right-[13%] top-[17%] h-[18%] w-[19%]", label: "Guard" },
    {
      className: "bottom-[12%] right-[12%] h-[20%] w-[21%]",
      label: "Warehouse",
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[38rem] lg:mr-0">
      <div className="absolute -inset-16 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#101b19] shadow-2xl shadow-black/40">
        <div className="flex h-11 items-center justify-between border-b border-white/10 bg-white/[0.025] px-4">
          <div className="flex items-center gap-2 text-xs font-medium text-white/70">
            <span className="size-2 rounded-full bg-emerald-400" />
            Frontier plan
          </div>
          <span className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-wider text-white/45">
            16 × 16 chunks
          </span>
        </div>
        <div className="landing-map relative aspect-[6/5] overflow-hidden p-5 sm:p-7">
          <div className="absolute inset-[8%] border-2 border-dashed border-amber-300/50 bg-amber-200/[0.025]" />
          <div className="absolute left-1/2 top-1/2 size-[46%] -translate-x-1/2 -translate-y-1/2 border border-dashed border-sky-300/55 bg-sky-300/[0.035]" />
          {buildings.map((building, index) => (
            <div
              key={building.label}
              className={cn(
                "absolute flex items-end rounded-[0.3rem] border p-1.5 shadow-lg sm:p-2",
                index === 0
                  ? "border-emerald-300/70 bg-emerald-700/80 text-emerald-50"
                  : "border-stone-300/30 bg-stone-700/90 text-stone-100",
                building.className,
              )}
            >
              <span className="truncate text-[0.48rem] font-semibold uppercase tracking-wider sm:text-[0.58rem]">
                {building.label}
              </span>
            </div>
          ))}
          <div className="absolute left-[61%] top-[30%] flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-[#0c1715]/90 px-2 py-1 text-[0.55rem] font-medium text-emerald-200 shadow-lg sm:text-[0.65rem]">
            <Check className="size-3" aria-hidden="true" />
            Claim valid
          </div>
        </div>
        <div className="grid grid-cols-3 border-t border-white/10 bg-white/[0.025] text-center text-[0.62rem] text-white/45 sm:text-xs">
          <span className="border-r border-white/10 px-2 py-3">
            5 buildings
          </span>
          <span className="border-r border-white/10 px-2 py-3">
            No collisions
          </span>
          <span className="px-2 py-3 text-emerald-300">All claimed</span>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-3 hidden rounded-2xl border border-white/10 bg-[#15231f]/95 p-3 shadow-xl backdrop-blur sm:flex sm:items-center sm:gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-amber-300/10 text-amber-200">
          <ShieldCheck className="size-4" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-xs font-semibold text-white">
            Guard coverage
          </span>
          <span className="block text-[0.68rem] text-white/45">
            Level-aware range
          </span>
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const publicEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f5ef] text-[#17201d]">
      <a
        href="#features"
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#17201d] shadow-lg transition focus:translate-y-0"
      >
        Skip to content
      </a>
      <section className="relative overflow-hidden bg-[#0c1715] text-white">
        <div className="landing-noise pointer-events-none absolute inset-0 opacity-30" />
        <div className="absolute -left-32 top-24 size-96 rounded-full bg-emerald-400/5 blur-3xl" />
        <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
          <Link href="/" aria-label="MineColonies Planner home">
            <BrandMark />
          </Link>
          <nav
            className="hidden items-center gap-7 text-sm text-white/65 md:flex"
            aria-label="Main navigation"
          >
            <a className="transition hover:text-white" href="#features">
              Features
            </a>
            <a className="transition hover:text-white" href="#styles">
              Styles
            </a>
            <a className="transition hover:text-white" href="#about">
              About
            </a>
            <a className="transition hover:text-white" href="#contact">
              Contact
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <a
              className="hidden size-10 items-center justify-center rounded-full border border-white/10 text-white/65 transition hover:border-white/25 hover:text-white sm:flex"
              href={siteConfig.repositoryUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="View the source on GitHub"
            >
              <GitFork className="size-4" aria-hidden="true" />
            </a>
            <Link
              href="/planner"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-emerald-400 text-[#0c1715] hover:bg-emerald-300",
              )}
            >
              Open planner
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </header>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-16 px-5 pb-24 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[0.92fr_1.08fr] lg:px-10 lg:pb-32 lg:pt-28">
          <div className="max-w-2xl">
            <Badge className="mb-7 h-auto border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-emerald-200">
              <Sparkles aria-hidden="true" />
              Built from real MineColonies data
            </Badge>
            <h1 className="text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-[4.7rem]">
              Plan the colony before you place the first block.
            </h1>
            <p className="mt-7 max-w-xl text-pretty text-lg leading-8 text-white/58 sm:text-xl">
              A block-accurate workspace for claims, upgrade footprints,
              commutes, and guard coverage—so your settlement works in-game as
              well as it looks on paper.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/planner"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-12 bg-emerald-400 px-6 text-[#0c1715] hover:bg-emerald-300",
                )}
              >
                Start planning
                <ArrowRight aria-hidden="true" />
              </Link>
              <a
                href={siteConfig.repositoryUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 border-white/15 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white",
                )}
              >
                <GitFork aria-hidden="true" />
                View on GitHub
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-white/42">
              {["No sign-up", "Browser-local saves", "Open source"].map(
                (item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <Check
                      className="size-3 text-emerald-300"
                      aria-hidden="true"
                    />
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>
          <PlannerPreview />
        </div>
      </section>

      <section
        className="border-b border-black/8 bg-[#ecece4]"
        aria-label="Project statistics"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-5 sm:px-8 lg:grid-cols-4 lg:px-10">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={cn(
                "px-3 py-8 text-center sm:py-10",
                index % 2 === 0 ? "border-r border-black/8" : "",
                index === 1 ? "lg:border-r" : "",
                index === 2
                  ? "border-t border-black/8 lg:border-r lg:border-t-0"
                  : "",
                index === 3 ? "border-t border-black/8 lg:border-t-0" : "",
              )}
            >
              <strong className="block text-3xl font-semibold tracking-tight sm:text-4xl">
                {stat.value}
              </strong>
              <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.17em] text-[#5f6b66]">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section
        id="features"
        className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32 lg:px-10"
      >
        <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:gap-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
              Planning intelligence
            </p>
            <h2 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              Every square tells you something useful.
            </h2>
            <p className="mt-5 max-w-md leading-7 text-[#5e6965]">
              The planner translates mod rules into clear feedback while you
              design—without trying to simulate the parts that only Minecraft
              can know.
            </p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-3xl border border-black/8 bg-black/8 sm:grid-cols-2">
            {features.map((feature) => (
              <article key={feature.title} className="bg-[#fafaf6] p-7 sm:p-8">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-700 text-emerald-50">
                  <feature.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-6 text-lg font-semibold tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#65706b]">
                  {feature.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="styles"
        className="relative overflow-hidden bg-[#17231f] py-24 text-white sm:py-32"
      >
        <div className="landing-noise pointer-events-none absolute inset-0 opacity-20" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                Not just Fortress
              </p>
              <h2 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                Every bundled style pack, ready when you are.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-white/50">
              Packs load on demand, keeping the first visit lean while the
              complete catalogue remains one click away.
            </p>
          </div>
          <div className="mt-14 flex flex-wrap gap-2.5">
            {builtInStylePackManifest.map((pack) => (
              <span
                key={pack.id}
                className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2.5 text-sm text-white/70 transition hover:border-emerald-300/30 hover:bg-emerald-300/5 hover:text-emerald-100"
              >
                {pack.name}
                <span className="ml-2 text-[0.65rem] text-white/30">
                  {pack.variantCount}
                </span>
              </span>
            ))}
          </div>
          <div className="mt-12">
            <Link
              href="/planner"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-white text-[#17231f] hover:bg-emerald-100",
              )}
            >
              Explore all styles
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section
        id="about"
        className="mx-auto grid max-w-7xl gap-10 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-2 lg:items-center lg:gap-20 lg:px-10"
      >
        <div className="relative min-h-80 overflow-hidden rounded-[2rem] bg-[#dfe6d7] p-8 sm:min-h-[28rem] sm:p-12">
          <div className="landing-map absolute inset-0 opacity-20" />
          <div className="absolute -bottom-16 -right-12 size-72 rounded-full border-[3rem] border-emerald-800/10" />
          <div className="relative flex h-full min-h-64 flex-col justify-between">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-emerald-800 text-emerald-50 shadow-lg">
              <HeartHandshake className="size-6" aria-hidden="true" />
            </span>
            <blockquote className="max-w-md text-2xl font-medium leading-snug tracking-tight sm:text-3xl">
              “Built to answer the questions I had while planning a fortress—and
              shared so the next colony starts stronger.”
            </blockquote>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
            An independent first project
          </p>
          <h2 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            Made by Scott, built in the open.
          </h2>
          <p className="mt-6 text-lg leading-8 text-[#5e6965]">
            I’m Scott William Jones, a Salisbury-based web developer and IT
            consultant. This planner grew from a real MineColonies build and a
            simple idea: the map should explain the same square claims and
            coverage you see in the game.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={siteConfig.author.url}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              <GitFork aria-hidden="true" />
              Scott on GitHub
            </a>
            <a
              href={siteConfig.author.website}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              Alice Systems
              <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section id="contact" className="px-5 pb-24 sm:px-8 sm:pb-32 lg:px-10">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border border-black/8 bg-[#ecece4] lg:grid-cols-[0.78fr_1.22fr]">
          <div className="bg-emerald-800 p-8 text-white sm:p-12">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
              <Mail className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-10 text-xs font-bold uppercase tracking-[0.22em] text-emerald-200">
              Contact
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em]">
              Help shape the next build.
            </h2>
            <p className="mt-5 leading-7 text-white/65">
              Found a blueprint issue? Have an idea for the planner? Tell me
              what would make your colony easier to design.
            </p>
            {publicEmail && (
              <a
                className="mt-8 inline-flex items-center gap-2 text-sm text-emerald-100 underline underline-offset-4"
                href={`mailto:${publicEmail}`}
              >
                {publicEmail}
              </a>
            )}
          </div>
          <div className="p-8 sm:p-12">
            <ContactForm />
          </div>
        </div>
      </section>

      <footer className="border-t border-black/8 bg-[#ecece4]">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <div className="flex items-center gap-3 text-[#17231f]">
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-800 text-emerald-50">
              <Castle className="size-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold">MineColonies Planner</span>
          </div>
          <p className="max-w-xl text-xs leading-5 text-[#6b756f]">
            An unofficial open-source planning tool. MineColonies names and
            blueprint data belong to their respective project contributors and
            are used under GPL-3.0.
          </p>
          <div className="flex gap-5 text-xs font-medium text-[#53605a]">
            <a
              className="hover:text-emerald-800"
              href={siteConfig.repositoryUrl}
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <a
              className="hover:text-emerald-800"
              href={siteConfig.author.url}
              target="_blank"
              rel="noreferrer"
            >
              Scott
            </a>
            <a className="hover:text-emerald-800" href="#contact">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

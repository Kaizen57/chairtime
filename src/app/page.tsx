import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarDays,
  Users,
  Clock,
  Scissors,
  CheckCircle,
  ArrowRight,
  Zap,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: CalendarDays,
    title: "Appointment Booking",
    description:
      "Clients pick their barber, select a service, and book a specific time slot. Fully automated confirmations and reminders.",
  },
  {
    icon: Clock,
    title: "Walk-in Queue",
    description:
      "Clients check in via QR code and see their real-time position and estimated wait. Barbers manage the queue from the dashboard.",
  },
  {
    icon: Zap,
    title: "Open Pool Scheduling",
    description:
      "Barbers post open time blocks to the shop pool. Clients pick a time — the system auto-assigns the best available barber.",
  },
  {
    icon: Users,
    title: "Team Management",
    description:
      "Shop owners invite barbers, manage schedules, and see all bookings in one place. Each barber gets their own public page.",
  },
  {
    icon: BarChart3,
    title: "Client CRM",
    description:
      "Every client who books automatically gets added to your contacts. See booking history, contact info, and lifetime visits.",
  },
  {
    icon: Scissors,
    title: "Service Catalog",
    description:
      "Create services with custom durations, prices, and buffer times. Show exactly what you offer on your public booking page.",
  },
];

const plans = [
  {
    name: "Solo",
    price: 19,
    description: "Perfect for independent barbers",
    features: [
      "1 barber",
      "Appointment booking",
      "Walk-in queue",
      "Open pool booking",
      "Client CRM",
      "Email notifications",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Shop",
    price: 49,
    description: "For barbershops with a team",
    features: [
      "Up to 10 barbers",
      "Everything in Solo",
      "Shop public page",
      "Team management",
      "Shop-wide queue",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Pro Shop",
    price: 99,
    description: "For large or multi-location shops",
    features: [
      "Unlimited barbers",
      "Everything in Shop",
      "Advanced analytics",
      "Custom branding",
      "API access",
      "Dedicated support",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="fixed top-0 w-full z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">ChairTime</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-600">
            <a href="#features" className="hover:text-zinc-900 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-zinc-900 transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Get started free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6">
            Built for barbers, by barbers
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-zinc-900 mb-6 leading-tight">
            Booking software your
            <br />
            clients will actually use
          </h1>
          <p className="text-xl text-zinc-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Appointments, walk-in queues, and open pool scheduling — all in one place.
            Built for individual barbers and entire barbershops.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link href="/signup">
                Start free — no credit card <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
              <Link href="/demo">See a live demo</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-zinc-400">14-day free trial on all plans</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-zinc-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Three ways clients can book you
            </h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
              Not every client books the same way. ChairTime handles all of them.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border-zinc-200">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center mb-4">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-zinc-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">Simple, honest pricing</h2>
            <p className="text-zinc-500 text-lg">14-day free trial on every plan. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={
                  plan.highlighted
                    ? "border-zinc-900 shadow-lg relative"
                    : "border-zinc-200"
                }
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-zinc-900 text-white">Most popular</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="font-bold text-xl text-zinc-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-zinc-500 mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-zinc-900">${plan.price}</span>
                    <span className="text-zinc-500">/mo</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-zinc-600">
                        <CheckCircle className="w-4 h-4 text-zinc-900 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/signup">{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-zinc-900 rounded-md flex items-center justify-center">
              <Scissors className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-zinc-900">ChairTime</span>
          </div>
          <p className="text-sm text-zinc-400">© 2026 ChairTime. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

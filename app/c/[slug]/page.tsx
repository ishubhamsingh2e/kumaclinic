import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Phone,
  MessageSquare,
  Clock,
  Globe,
  Mail,
  Star,
  ExternalLink,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";

export default async function PublicClinicPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = await params;

  const clinic = await prisma.clinic.findFirst({
    where: {
      OR: [{ slug: slug }, { id: slug }],
      isPublished: true,
    },
    include: {
      locations: true,
    },
  });

  if (!clinic) {
    notFound();
  }

  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Hero Section */}
      <div className="relative h-64 w-full overflow-hidden md:h-80">
        {clinic.coverImage ? (
          <img
            src={clinic.coverImage}
            alt={clinic.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="bg-primary/10 h-full w-full" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Profile Header */}
      <div className="relative z-10 mx-auto -mt-16 max-w-5xl px-4 md:-mt-20">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-end">
          <Avatar className="border-background h-32 w-32 rounded-2xl border-4 shadow-xl md:h-40 md:w-40">
            <AvatarImage
              src={clinic.profileImage || ""}
              className="rounded-2xl"
            />
            <AvatarFallback className="rounded-2xl text-4xl">
              {clinic.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 pb-2">
            <h1 className="text-foreground mb-2 text-3xl font-bold drop-shadow-sm md:text-4xl md:text-white">
              {clinic.name}
            </h1>
            <div className="flex flex-wrap gap-3">
              {clinic.googleReviewsUrl && (
                <Link href={clinic.googleReviewsUrl} target="_blank">
                  <Badge className="text-primary gap-1.5 bg-white px-3 py-1 hover:bg-white/90">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    Reviews
                  </Badge>
                </Link>
              )}
              {clinic.whatsapp && (
                <Link href={`https://wa.me/${clinic.whatsapp}`} target="_blank">
                  <Badge className="gap-1.5 bg-[#25D366] px-3 py-1 text-white hover:bg-[#25D366]/90">
                    <MessageSquare className="h-3.5 w-3.5 fill-current" />
                    WhatsApp
                  </Badge>
                </Link>
              )}
            </div>
          </div>
          <div className="flex w-full gap-3 md:w-auto">
            <Button size="lg" className="flex-1 gap-2 md:flex-none">
              <CalendarDays className="h-5 w-5" /> Book Appointment
            </Button>
          </div>
        </div>

        {/* Bio / About */}
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">About</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {clinic.bio ||
                  `Welcome to ${clinic.name}. We provide professional healthcare services tailored to your needs.`}
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold">Our Locations</h2>
              <div className="grid gap-6">
                {clinic.locations.map((loc) => (
                  <Card
                    key={loc.id}
                    className="bg-muted/30 overflow-hidden border-none shadow-sm"
                  >
                    <CardContent className="p-0">
                      <div className="grid md:grid-cols-2">
                        <div className="space-y-4 p-6">
                          <h3 className="text-xl font-semibold">{loc.name}</h3>
                          <div className="space-y-3 text-sm">
                            <div className="flex items-start gap-3">
                              <MapPin className="text-primary h-5 w-5 shrink-0" />
                              <span>
                                {loc.address}, {loc.city}, {loc.state} {loc.zip}
                              </span>
                            </div>
                            {loc.phone && (
                              <div className="flex items-center gap-3">
                                <Phone className="text-primary h-5 w-5 shrink-0" />
                                <a
                                  href={`tel:${loc.phone}`}
                                  className="hover:underline"
                                >
                                  {loc.phone}
                                </a>
                              </div>
                            )}
                            {loc.email && (
                              <div className="flex items-center gap-3">
                                <Mail className="text-primary h-5 w-5 shrink-0" />
                                <a
                                  href={`mailto:${loc.email}`}
                                  className="hover:underline"
                                >
                                  {loc.email}
                                </a>
                              </div>
                            )}
                          </div>
                          {loc.googleMapsUrl && (
                            <Button
                              variant="outline"
                              asChild
                              className="w-full justify-center gap-2"
                            >
                              <Link href={loc.googleMapsUrl} target="_blank">
                                <ExternalLink className="h-4 w-4" /> Open in
                                Maps
                              </Link>
                            </Button>
                          )}
                        </div>
                        <div className="bg-muted border-l p-6">
                          <h4 className="mb-4 flex items-center gap-2 font-semibold">
                            <Clock className="text-primary h-4 w-4" /> Opening
                            Hours
                          </h4>
                          <div className="space-y-2 text-sm">
                            {days.map((day) => {
                              const hours = (loc.openingHours as any)?.[day];
                              return (
                                <div
                                  key={day}
                                  className="flex items-center justify-between capitalize"
                                >
                                  <span
                                    className={
                                      day ===
                                      new Date()
                                        .toLocaleDateString("en-US", {
                                          weekday: "long",
                                        })
                                        .toLowerCase()
                                        ? "text-primary font-bold"
                                        : "text-muted-foreground"
                                    }
                                  >
                                    {day}
                                  </span>
                                  <span>
                                    {hours?.closed ? (
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px]"
                                      >
                                        Closed
                                      </Badge>
                                    ) : (
                                      `${hours?.open || "09:00"} - ${hours?.close || "17:00"}`
                                    )}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-6 p-6">
                <h3 className="text-lg font-bold">Quick Contact</h3>
                <div className="space-y-4">
                  {clinic.phone && (
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary rounded-full p-2">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">
                          Phone
                        </span>
                        <a
                          href={`tel:${clinic.phone}`}
                          className="text-sm font-medium hover:underline"
                        >
                          {clinic.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {clinic.email && (
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary rounded-full p-2">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">
                          Email
                        </span>
                        <a
                          href={`mailto:${clinic.email}`}
                          className="text-sm font-medium hover:underline"
                        >
                          {clinic.email}
                        </a>
                      </div>
                    </div>
                  )}
                  {clinic.whatsapp && (
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-[#25D366]/10 p-2 text-[#25D366]">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">
                          WhatsApp
                        </span>
                        <a
                          href={`https://wa.me/${clinic.whatsapp}`}
                          className="text-sm font-medium hover:underline"
                        >
                          {clinic.whatsapp}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                <Button className="w-full gap-2">
                  <CalendarDays className="h-4 w-4" /> Book Appointment
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

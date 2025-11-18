import { NextRequest, NextResponse } from "next/server";
import type { RelayPoint } from "@/types";

/**
 * API endpoint to fetch relay points near a given postal code or city
 * In production, this should integrate with providers like:
 * - Mondial Relay API
 * - Colissimo Points Retrait API
 * - Chronopost Pickup API
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const postalCode = searchParams.get("postalCode");
    const city = searchParams.get("city");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!postalCode && !city) {
      return NextResponse.json(
        { success: false, error: "Code postal ou ville requis" },
        { status: 400 }
      );
    }

    // TODO: In production, integrate with actual relay point provider API
    // For now, return mock data based on postal code

    // Mock relay points data
    const mockRelayPoints: RelayPoint[] = generateMockRelayPoints(
      postalCode || "",
      city || "",
      limit
    );

    return NextResponse.json({
      success: true,
      data: mockRelayPoints,
    });
  } catch (error) {
    console.error("Relay points fetch error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de la récupération des points relais",
      },
      { status: 500 }
    );
  }
}

/**
 * Generate mock relay points for development
 * Replace this with actual API integration in production
 */
function generateMockRelayPoints(
  postalCode: string,
  city: string,
  limit: number
): RelayPoint[] {
  const basePoints = [
    {
      id: "relay-1",
      name: "Relay Point - Bureau de Tabac",
      address: "15 Rue de la République",
      city: city || "Paris",
      postalCode: postalCode || "75001",
      distance: 0.5,
      openingHours: [
        "Lun-Ven: 08:00-19:00",
        "Sam: 09:00-18:00",
        "Dim: Fermé",
      ],
      coordinates: {
        lat: 48.8566,
        lng: 2.3522,
      },
    },
    {
      id: "relay-2",
      name: "Mondial Relay - Supermarché",
      address: "42 Avenue des Champs",
      city: city || "Paris",
      postalCode: postalCode || "75001",
      distance: 0.8,
      openingHours: [
        "Lun-Sam: 07:00-21:00",
        "Dim: 08:00-13:00",
      ],
      coordinates: {
        lat: 48.8556,
        lng: 2.3512,
      },
    },
    {
      id: "relay-3",
      name: "Pickup Point - Pressing",
      address: "8 Boulevard Saint-Michel",
      city: city || "Paris",
      postalCode: postalCode || "75001",
      distance: 1.2,
      openingHours: [
        "Lun-Ven: 09:00-18:30",
        "Sam: 10:00-17:00",
        "Dim: Fermé",
      ],
      coordinates: {
        lat: 48.8546,
        lng: 2.3502,
      },
    },
    {
      id: "relay-4",
      name: "Colissimo - Boulangerie",
      address: "23 Rue du Commerce",
      city: city || "Paris",
      postalCode: postalCode || "75001",
      distance: 1.5,
      openingHours: [
        "Lun-Sam: 06:30-20:00",
        "Dim: 07:00-13:00",
      ],
      coordinates: {
        lat: 48.8536,
        lng: 2.3492,
      },
    },
    {
      id: "relay-5",
      name: "Relay Point - Pharmacie",
      address: "56 Rue de Rivoli",
      city: city || "Paris",
      postalCode: postalCode || "75001",
      distance: 2.0,
      openingHours: [
        "Lun-Ven: 08:30-19:30",
        "Sam: 09:00-18:00",
        "Dim: Fermé",
      ],
      coordinates: {
        lat: 48.8526,
        lng: 2.3482,
      },
    },
    {
      id: "relay-6",
      name: "Pickup - Librairie",
      address: "31 Rue Saint-Antoine",
      city: city || "Paris",
      postalCode: postalCode || "75001",
      distance: 2.3,
      openingHours: [
        "Lun-Sam: 10:00-19:00",
        "Dim: Fermé",
      ],
      coordinates: {
        lat: 48.8516,
        lng: 2.3472,
      },
    },
    {
      id: "relay-7",
      name: "Mondial Relay - Cordonnerie",
      address: "12 Place de la Bastille",
      city: city || "Paris",
      postalCode: postalCode || "75001",
      distance: 2.8,
      openingHours: [
        "Lun-Ven: 09:00-18:00",
        "Sam: 10:00-16:00",
        "Dim: Fermé",
      ],
      coordinates: {
        lat: 48.8506,
        lng: 2.3462,
      },
    },
    {
      id: "relay-8",
      name: "Relay Point - Station Service",
      address: "78 Rue de Lyon",
      city: city || "Paris",
      postalCode: postalCode || "75001",
      distance: 3.2,
      openingHours: [
        "Lun-Dim: 06:00-22:00",
      ],
      coordinates: {
        lat: 48.8496,
        lng: 2.3452,
      },
    },
    {
      id: "relay-9",
      name: "Colissimo - Papeterie",
      address: "90 Boulevard Voltaire",
      city: city || "Paris",
      postalCode: postalCode || "75001",
      distance: 3.5,
      openingHours: [
        "Lun-Ven: 09:00-19:00",
        "Sam: 09:30-18:30",
        "Dim: Fermé",
      ],
      coordinates: {
        lat: 48.8486,
        lng: 2.3442,
      },
    },
    {
      id: "relay-10",
      name: "Pickup Point - Fleuriste",
      address: "5 Avenue Parmentier",
      city: city || "Paris",
      postalCode: postalCode || "75001",
      distance: 4.0,
      openingHours: [
        "Lun-Sam: 08:00-19:30",
        "Dim: 09:00-13:00",
      ],
      coordinates: {
        lat: 48.8476,
        lng: 2.3432,
      },
    },
  ];

  // Return limited number of points
  return basePoints.slice(0, Math.min(limit, basePoints.length));
}

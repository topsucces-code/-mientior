import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sizeGuides = await prisma.sizeGuide.findMany({
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    const formattedGuides = sizeGuides.map((guide) => {
      const measurements = guide.measurements as any[];
      const fitRecommendations = (guide.measurements as any)?.fitRecommendations || [];

      return {
        id: guide.id,
        categoryId: guide.categoryId,
        categoryName: guide.category.name,
        measurementCount: Array.isArray(measurements) ? measurements.length : 0,
        fitRecommendationCount: Array.isArray(fitRecommendations)
          ? fitRecommendations.length
          : 0,
        updatedAt: guide.updatedAt,
      };
    });

    return NextResponse.json(formattedGuides);
  } catch (error) {
    console.error("Failed to fetch size guides:", error);
    return NextResponse.json(
      { error: "Failed to fetch size guides" },
      { status: 500 }
    );
  }
}

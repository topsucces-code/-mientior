import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { questionId: string } }
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { questionId } = params;

    const question = await prisma.productQuestion.update({
      where: { id: questionId },
      data: {
        status: "APPROVED",
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      question,
    });
  } catch (error) {
    console.error("Failed to approve question:", error);
    return NextResponse.json(
      { error: "Failed to approve question" },
      { status: 500 }
    );
  }
}

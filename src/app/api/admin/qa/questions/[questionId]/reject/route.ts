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
        status: "REJECTED",
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      question,
    });
  } catch (error) {
    console.error("Failed to reject question:", error);
    return NextResponse.json(
      { error: "Failed to reject question" },
      { status: 500 }
    );
  }
}

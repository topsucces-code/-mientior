import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const status = searchParams.get("status") || "PENDING";

    const where: {
      status: string;
      productId?: string;
    } = {
      status,
    };

    if (productId) {
      where.productId = productId;
    }

    const questions = await prisma.productQuestion.findMany({
      where,
      include: {
        product: {
          select: {
            name: true,
          },
        },
        answers: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedQuestions = questions.map((q) => ({
      id: q.id,
      productId: q.productId,
      productName: q.product.name,
      userId: q.userId,
      userName: "User", // TODO: Fetch actual user name
      question: q.question,
      status: q.status,
      helpful: q.helpful,
      notHelpful: q.notHelpful,
      verified: q.verified,
      createdAt: q.createdAt,
      answers: q.answers.map((a) => ({
        id: a.id,
        questionId: a.questionId,
        userId: a.userId,
        vendorId: a.vendorId,
        answer: a.answer,
        isOfficial: a.isOfficial,
        createdAt: a.createdAt,
      })),
    }));

    return NextResponse.json(formattedQuestions);
  } catch (error) {
    console.error("Failed to fetch questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

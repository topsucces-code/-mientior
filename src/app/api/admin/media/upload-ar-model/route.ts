import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const platform = formData.get("platform") as string;
    const productId = formData.get("productId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate platform
    if (!["ios", "android"].includes(platform)) {
      return NextResponse.json(
        { error: "Invalid platform. Must be 'ios' or 'android'." },
        { status: 400 }
      );
    }

    // Validate file type based on platform
    const fileName = file.name.toLowerCase();
    if (platform === "ios" && !fileName.endsWith(".usdz")) {
      return NextResponse.json(
        { error: "Invalid file type for iOS. Only USDZ files are allowed." },
        { status: 400 }
      );
    }

    if (platform === "android" && !fileName.endsWith(".glb") && !fileName.endsWith(".gltf")) {
      return NextResponse.json(
        { error: "Invalid file type for Android. Only GLB/GLTF files are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB." },
        { status: 400 }
      );
    }

    // In a real implementation, you would upload to a cloud storage service
    // For now, we'll simulate the upload and return a mock URL
    const uploadFileName = `${Date.now()}-${file.name}`;
    const url = `/uploads/ar-models/${platform}/${uploadFileName}`;

    // TODO: Implement actual AR model upload to cloud storage (S3, Cloudinary, etc.)
    // TODO: Validate AR model format and optimize if needed
    // const uploadResult = await uploadToCloudStorage(file);
    // const validation = await validateARModel(file, platform);

    return NextResponse.json({
      url,
      fileName: file.name,
      size: file.size,
      platform,
    });
  } catch (error) {
    console.error("AR model upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload AR model" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { LAMBDA_UPLOAD_ENDPOINT, RATE_LIMIT_ENDPOINT } from "@/lib/env";

// Helper function to check rate limiting
async function checkRateLimit(
  clientIp: string
): Promise<{ allowed: boolean; error?: string }> {
  if (!RATE_LIMIT_ENDPOINT) {
    // If rate limiting is not configured, allow the request
    return { allowed: true };
  }

  try {
    const rateLimitResponse = await fetch(`${RATE_LIMIT_ENDPOINT}/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        serviceId: "upload-images",
        clientId: clientIp,
        metadata: {
          userTier: "default", // You can make this dynamic based on user data
        },
      }),
    });

    const rateLimitResult = await rateLimitResponse.json();

    if (!rateLimitResponse.ok) {
      return {
        allowed: false,
        error: rateLimitResult.message || "Rate limit check failed",
      };
    }

    // Assuming the rate limit service returns { allowed: boolean }
    return { allowed: rateLimitResult.allowed || true };
  } catch (error) {
    console.error("Error checking rate limit:", error);
    // In case of rate limit service failure, allow the request to proceed
    // You might want to change this behavior based on your requirements
    return { allowed: true };
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    // Get the request body
    const body = await request.json();
    const { userRole, images } = body;

    // Validate required fields
    if (!userRole || !images) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get client IP
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const clientIp = forwarded
      ? forwarded.split(",")[0].trim()
      : realIp || "unknown";

    // Check rate limiting first
    const rateLimitCheck = await checkRateLimit(clientIp);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            rateLimitCheck.error ||
            "Rate limit exceeded. Please try again later.",
        },
        { status: 429 }
      );
    }

    // Check if lambda endpoint is configured
    if (!LAMBDA_UPLOAD_ENDPOINT) {
      return NextResponse.json(
        { success: false, error: "Lambda endpoint not configured" },
        { status: 500 }
      );
    }

    // Prepare payload for lambda (no need to include IP since it's only used for rate limiting)
    const lambdaPayload = {
      roomId: params.roomId,
      userRole,
      images,
    };

    // Make request to lambda
    const lambdaResponse = await fetch(LAMBDA_UPLOAD_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(lambdaPayload),
    });

    // Get lambda response
    const lambdaResult = await lambdaResponse.json();

    // Return lambda response with appropriate status
    if (lambdaResponse.ok) {
      return NextResponse.json(lambdaResult);
    } else {
      return NextResponse.json(lambdaResult, { status: lambdaResponse.status });
    }
  } catch (error) {
    console.error("Error in upload-images API route:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

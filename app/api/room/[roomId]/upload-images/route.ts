import { NextRequest, NextResponse } from "next/server";
import { LAMBDA_UPLOAD_ENDPOINT, RATE_LIMIT_ENDPOINT } from "@/lib/env";

// Rate limit response interface
interface RateLimitResponse {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  metadata: {
    serviceId: string;
    windowMs: number;
    maxRequests: number;
  };
}

// Helper function to check rate limiting
async function checkRateLimit(clientIp: string): Promise<{
  allowed: boolean;
  error?: string;
  rateLimitInfo?: RateLimitResponse;
  userFriendlyMessage?: string;
  debugInfo?: any;
}> {
  console.log("🔍 Starting rate limit check:", {
    clientIp,
    endpoint: RATE_LIMIT_ENDPOINT,
    hasEndpoint: !!RATE_LIMIT_ENDPOINT,
  });

  if (!RATE_LIMIT_ENDPOINT) {
    console.log("⚠️ Rate limiting not configured, allowing request");
    return { allowed: true };
  }

  try {
    const requestPayload = {
      serviceId: "upload-images",
      clientId: clientIp,
      metadata: {
        userTier: "default", // You can make this dynamic based on user data
      },
    };

    console.log("🚀 Rate Limit Request:", {
      endpoint: `${RATE_LIMIT_ENDPOINT}/check`,
      payload: requestPayload,
      clientIp,
    });

    const rateLimitResponse = await fetch(`${RATE_LIMIT_ENDPOINT}/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    console.log("📡 Rate Limit Response Status:", {
      status: rateLimitResponse.status,
      statusText: rateLimitResponse.statusText,
      ok: rateLimitResponse.ok,
      headers: Object.fromEntries(rateLimitResponse.headers.entries()),
    });

    // Clone the response to read it multiple times
    const responseClone = rateLimitResponse.clone();
    const responseText = await responseClone.text();

    console.log("📄 Rate Limit Response Body (raw):", responseText);

    let rateLimitResult: RateLimitResponse;
    try {
      rateLimitResult = JSON.parse(responseText);
      console.log("✅ Rate Limit Response Body (parsed):", rateLimitResult);
    } catch (parseError) {
      console.error("❌ Failed to parse rate limit response:", parseError);
      return {
        allowed: false,
        error: "Rate limit service returned invalid JSON",
        userFriendlyMessage:
          "Unable to process request at this time. Please try again later.",
      };
    }

    if (!rateLimitResponse.ok) {
      console.error("❌ Rate Limit Request Failed:", {
        status: rateLimitResponse.status,
        statusText: rateLimitResponse.statusText,
        response: rateLimitResult,
      });

      return {
        allowed: false,
        error: "Rate limit service error",
        userFriendlyMessage:
          "Unable to process request at this time. Please try again later.",
        debugInfo: {
          status: rateLimitResponse.status,
          statusText: rateLimitResponse.statusText,
          endpoint: RATE_LIMIT_ENDPOINT,
          clientIp,
          responseText: responseText.substring(0, 200), // First 200 chars
        },
      };
    }

    if (!rateLimitResult.allowed) {
      console.log("🚫 Rate Limit Exceeded:", {
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
        retryAfter: rateLimitResult.retryAfter,
        metadata: rateLimitResult.metadata,
      });

      // Create user-friendly message based on rate limit info
      const waitTime =
        rateLimitResult.retryAfter ||
        Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      const waitMinutes = Math.ceil(waitTime / 60);

      let friendlyMessage = "You've reached the upload limit. ";
      if (waitTime <= 60) {
        friendlyMessage += `Please wait ${waitTime} seconds before trying again.`;
      } else if (waitMinutes <= 60) {
        friendlyMessage += `Please wait ${waitMinutes} minutes before trying again.`;
      } else {
        friendlyMessage += "Please try again later.";
      }

      return {
        allowed: false,
        rateLimitInfo: rateLimitResult,
        error: "Rate limit exceeded",
        userFriendlyMessage: friendlyMessage,
      };
    }

    console.log("✅ Rate Limit Passed:", {
      remaining: rateLimitResult.remaining,
      resetTime: rateLimitResult.resetTime,
      metadata: rateLimitResult.metadata,
    });

    return {
      allowed: true,
      rateLimitInfo: rateLimitResult,
    };
  } catch (error) {
    console.error("💥 Error checking rate limit:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      clientIp,
      endpoint: RATE_LIMIT_ENDPOINT,
    });
    // In case of rate limit service failure, allow the request to proceed
    // You might want to change this behavior based on your requirements
    console.log("🔄 Allowing request to proceed despite rate limit error");
    return { allowed: true };
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    // Await the params
    const { roomId } = await params;

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
      const responseData: any = {
        success: false,
        error: rateLimitCheck.error || "Rate limit exceeded",
        message:
          rateLimitCheck.userFriendlyMessage || "Please try again later.",
      };

      // Include rate limit details if available
      if (rateLimitCheck.rateLimitInfo) {
        responseData.rateLimitInfo = {
          remaining: rateLimitCheck.rateLimitInfo.remaining,
          resetTime: rateLimitCheck.rateLimitInfo.resetTime,
          retryAfter: rateLimitCheck.rateLimitInfo.retryAfter,
          maxRequests: rateLimitCheck.rateLimitInfo.metadata.maxRequests,
        };
      }

      // Include debug info in development or if available
      if (rateLimitCheck.debugInfo) {
        responseData.debugInfo = rateLimitCheck.debugInfo;
      }

      return NextResponse.json(responseData, { status: 429 });
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
      roomId,
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

import { getJob } from "@/lib/server/queries";
import { assertLocalRequest } from "@/lib/server/security";
import { AppError, isUuid } from "@/lib/validation";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    assertLocalRequest(request);
    const { jobId } = await params;
    if (!isUuid(jobId)) throw new AppError("Invalid job ID.", 400);
    const job = await getJob(jobId);
    if (!job)
      throw new AppError("This opportunity is no longer available.", 404);
    return Response.json(job, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof AppError
            ? error.message
            : "This job could not be loaded.",
      },
      { status: error instanceof AppError ? error.status : 500 },
    );
  }
}

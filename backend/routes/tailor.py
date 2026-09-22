from fastapi import APIRouter, HTTPException
from schemas import TailorRequest, TailorResponse
from graphs.resume_tailor_graph import resume_tailor_graph

router = APIRouter(prefix="/api/tailor", tags=["Tailor"])

@router.post("/resume", response_model=TailorResponse)
async def tailor_resume(req: TailorRequest):
    try:
        graph_input = {"request": req, "result": {}}
        graph_output = await resume_tailor_graph.ainvoke(graph_input)
        result = graph_output.get("result", {})
        
        return TailorResponse(
            targetRole=result.get("targetRole") or result.get("title") or "Target Position",
            title=result.get("title", "Full Stack Generative AI Engineer"),
            summary=result.get("summary", ""),
            skills=result.get("skills", []),
            projects=result.get("projects", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tailoring failed: {str(e)}")

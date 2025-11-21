import os
from typing import List, Literal, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import google.generativeai as genai

MODEL_NAME = "gemini-2.5-flash"   
API_KEY = os.getenv("GEMINI_API_KEY")

router = APIRouter()

if not API_KEY:
    raise RuntimeError("Missing GEMINI_API_KEY")

genai.configure(api_key=API_KEY)

class Message(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str = Field(..., min_length=1)

class ChatRequest(BaseModel):
    messages: List[Message]
    # Optional context you might pass (e.g., shops the user just saw)
    context: Optional[dict] = None

class ChatResponse(BaseModel):
    content: str

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    try:
        # Build the prompt history for Gemini
        # Gemini expects a list of parts; we keep it simple with text parts.
        history = []
        for m in req.messages:
            if m.role == "user":
                history.append({"role": "user", "parts": [{"text": m.content}]})
            elif m.role == "assistant":
                history.append({"role": "model", "parts": [{"text": m.content}]})
            # "system" → fold into an instruction at the top (next line)

        system_instruction = (
            "You are a helpful café market research assistant working for your client, a coffee shop owner. "
            "You have access to general web knowledge and can look up publicly available information about competitors, such as their menu items, bestsellers, store offerings, pricing, and brand positioning. "
            "Use this information to give accurate, well-sourced insights about local coffee shops, their products, and what customers like about them. "
            "You can also provide suggestions on business strategies that will maximize profits and grow sales for your client."
            "You can analyze or summarize any review excerpts the user provides, combine that with publicly known details, and provide strategic suggestions for menu development, marketing, and business growth. "
            "If information is unavailable or uncertain, state that clearly instead of completely fabricating information."
        )

        # Pass through context (shops that were retrieved previously)
        if req.context:
            history.insert(0, {
                "role": "user",
                "parts": [{"text": f"Context (nearby shops):\n{req.context}"}],
            })

        model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            system_instruction=system_instruction,
        )

        # The last user message
        if not history or history[-1]["role"] != "user":
            raise HTTPException(400, "Last message must be from user.")

        resp = model.generate_content(history)
        text = (resp.text or "").strip()

        return ChatResponse(content=text or "I couldn't generate a response. Please reload the page or try again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed to generate a response: {e}")

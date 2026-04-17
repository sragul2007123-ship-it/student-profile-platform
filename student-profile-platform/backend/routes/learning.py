from fastapi import APIRouter, HTTPException, Request
import httpx
import os
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

@router.post("/chat")
async def chat_proxy(request: Request):
    try:
        data = await request.json()
        system_instruction = data.get("systemInstruction", {})
        contents = data.get("contents", [])
        generation_config = data.get("generationConfig", {})

        system_prompt = ""
        if "parts" in system_instruction and len(system_instruction["parts"]) > 0:
            system_prompt = system_instruction["parts"][0].get("text", "")

        messages = [{"role": "system", "content": system_prompt}]
        
        for c in contents:
            role = "assistant" if c.get("role") == "model" else "user"
            content = "\n".join([p.get("text", "") for p in c.get("parts", [])])
            messages.append({"role": role, "content": content})

        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            logger.error("GROQ_API_KEY NOT FOUND in environment")
            return {"error": {"message": "AI API Key is missing. Please check backend .env"}}

        logger.info(f"Sending request to Groq for model: llama-3.3-70b-versatile")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                GROQ_API_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}"
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": messages,
                    "max_tokens": generation_config.get("maxOutputTokens", 1000),
                    "temperature": generation_config.get("temperature", 0.7),
                },
                timeout=60.0
            )

            if response.status_code != 200:
                logger.error(f"Groq API error: {response.text}")
                return {"error": {"message": f"Groq API error: {response.status_code}"}}

            resp_data = response.json()
            text = resp_data.get("choices", [{}])[0].get("message", {}).get("content", "")

            return {
                "candidates": [{"content": {"parts": [{"text": text}]}}]
            }

    except Exception as e:
        logger.error(f"Server error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

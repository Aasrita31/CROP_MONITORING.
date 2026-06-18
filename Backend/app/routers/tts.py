from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from gtts import gTTS
import io

router = APIRouter(tags=["TTS"])

@router.get("/tts")
def get_tts_audio(text: str, lang: str = "en"):
    """
    Generate Text-to-Speech audio using gTTS and return an MP3 stream.
    """
    try:
        # Generate speech
        tts = gTTS(text=text, lang=lang)
        
        # Save to memory
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        
        # Return as an audio stream
        from fastapi.responses import Response
        return Response(content=fp.read(), media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS Generation failed: {str(e)}")

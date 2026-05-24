import asyncio
import logging
from typing import Any

log = logging.getLogger(__name__)

_pc: Any = None        # Pinecone client instance
_assistant: Any = None  # Assistant instance

_INSTRUCTIONS = """\
You are an authoritative expert advisor for new immigrants to Israel (olim chadashim) \
and IDF lone soldiers. Base your answers strictly on the uploaded official documents. \
Cover: aliyah law, Law of Return, Misrad HaPnim, Bituach Leumi, Kupat Holim, sal klita, \
lone-soldier rights and benefits, IDF regulations, ulpan, housing law, tax exemptions \
for new olim. \
Answer in clear Markdown with headers and bullet points. Always cite the source document \
section when available. If a specific detail is not covered in the uploaded documents, \
say so explicitly and direct the user to the relevant official agency.\
"""


async def get_pinecone():
    global _pc
    if _pc is None:
        from pinecone import Pinecone
        from app.config import settings
        _pc = Pinecone(api_key=settings.pinecone_api_key)
    return _pc


async def get_assistant():
    global _assistant
    if _assistant is not None:
        return _assistant

    from app.config import settings
    pc = await get_pinecone()

    try:
        _assistant = await asyncio.to_thread(
            pc.assistant.create_assistant,
            assistant_name=settings.pinecone_assistant_name,
            instructions=_INSTRUCTIONS,
            region=settings.pinecone_region,
        )
        log.info("Pinecone assistant created: %s", settings.pinecone_assistant_name)
    except Exception as e:
        if "ALREADY_EXISTS" in str(e) or "409" in str(e) or "already exists" in str(e).lower():
            # Assistant already exists — fetch the existing instance
            _assistant = await asyncio.to_thread(
                pc.assistant.describe_assistant,
                assistant_name=settings.pinecone_assistant_name,
            )
            log.info("Pinecone assistant connected: %s", settings.pinecone_assistant_name)
        else:
            log.error("Failed to initialise Pinecone assistant: %s", e)
            raise

    return _assistant


async def close_pinecone() -> None:
    global _pc, _assistant
    _pc = None
    _assistant = None

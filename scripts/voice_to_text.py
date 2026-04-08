#!/usr/bin/env python3
"""
Voice-to-Text: OGG/audio faylni Gemini API orqali o'zbek matniga o'giradi.
Usage: python3 voice_to_text.py <audio_file_path>
GEMINI_API_KEY environment variable kerak.
"""
import sys
import os


def main():
    if len(sys.argv) < 2:
        print("Usage: voice_to_text.py <audio_file_path>", file=sys.stderr)
        sys.exit(1)

    file_path = sys.argv[1]
    if not os.path.isfile(file_path):
        print(f"Fayl topilmadi: {file_path}", file=sys.stderr)
        sys.exit(1)

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY environment variable sozlanmagan", file=sys.stderr)
        sys.exit(1)

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

    audio_bytes = open(file_path, "rb").read()

    ext = os.path.splitext(file_path)[1].lower()
    mime_map = {
        ".ogg": "audio/ogg",
        ".oga": "audio/ogg",
        ".wav": "audio/wav",
        ".mp3": "audio/mpeg",
        ".m4a": "audio/mp4",
        ".webm": "audio/webm",
    }
    mime = mime_map.get(ext, "audio/ogg")

    system_prompt = (
        "Sen ovozli xabarni matnga o'girayapsan. "
        "O'zbek va rus tillarini tushunasan. "
        "Faqat aytilgan so'zlarni aniq yoz. "
        "Timestamp qo'shma. Faqat toza matn qaytar."
    )

    user_prompt = (
        "Bu ovozli xabar. Aytilganlarni so'zma-so'z aniq yoz. "
        "Javobda faqat transkripsiya bo'lsin, boshqa hech narsa qo'shma."
    )

    try:
        response = client.models.generate_content(
            model=model,
            contents=[
                types.Part.from_bytes(data=audio_bytes, mime_type=mime),
                user_prompt,
            ],
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.1,
                max_output_tokens=4096,
            ),
        )
        text = (response.text or "").strip()
        if text:
            print(text)
        else:
            print("(ovoz tushunilmadi)", file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(f"Gemini xato: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

import json
import os

from openai import OpenAI


def _get_client() -> OpenAI:
    api_key = os.getenv("DASHSCOPE_API_KEY")
    if not api_key:
        raise RuntimeError("DASHSCOPE_API_KEY environment variable is not set")
    return OpenAI(
        api_key=api_key,
        base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    )


def call_qwen(system_prompt: str, user_prompt: str, model: str = "qwen3.5-flash") -> str:
    """
    Send a prompt to Qwen and return the text response.
    Raises RuntimeError on API failure.
    """
    client = _get_client()

    completion = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )

    return completion.choices[0].message.content.strip()


def call_qwen_json(system_prompt: str, user_prompt: str, model: str = "qwen3.5-flash") -> dict | list:
    """
    Like call_qwen but expects and parses a JSON response.
    Raises ValueError if response is not valid JSON.
    """
    raw = call_qwen(system_prompt=system_prompt, user_prompt=user_prompt, model=model)

    # Strip markdown code fences if model wraps response in ```json ... ```
    if raw.startswith("```"):
        lines = raw.splitlines()
        raw = "\n".join(lines[1:-1]) if lines[-1] == "```" else "\n".join(lines[1:])

    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f"Qwen returned invalid JSON: {e}\nRaw response:\n{raw}")
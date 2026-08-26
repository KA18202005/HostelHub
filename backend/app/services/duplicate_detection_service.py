import re

from google import genai

from app.core.config import settings
from app.schemas.duplicate import DuplicateDetectionResult


client = genai.Client(
    api_key=settings.GEMINI_API_KEY
)


MAX_CANDIDATES = 10


def _tokenize(text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"\b[a-zA-Z0-9]+\b", text.lower())
        if len(token) > 2
    }


def _candidate_score(
    new_tokens: set[str],
    complaint: dict,
) -> int:
    existing_tokens = _tokenize(
        f"{complaint['title']} {complaint['description']}"
    )

    return len(new_tokens & existing_tokens)


def _select_candidates(
    title: str,
    description: str,
    existing_complaints: list[dict],
) -> list[dict]:
    new_tokens = _tokenize(
        f"{title} {description}"
    )

    scored_complaints = [
        (
            _candidate_score(new_tokens, complaint),
            complaint,
        )
        for complaint in existing_complaints
    ]

    scored_complaints.sort(
        key=lambda item: item[0],
        reverse=True,
    )

    return [
        complaint
        for score, complaint in scored_complaints[:MAX_CANDIDATES]
        if score > 0
    ]


def detect_duplicate(
    title: str,
    description: str,
    existing_complaints: list[dict],
) -> DuplicateDetectionResult:

    if not existing_complaints:
        return DuplicateDetectionResult(
            is_duplicate=False,
            similar_complaint_id=None,
            confidence=0.0,
            reason="No existing active complaints were found for comparison.",
        )

    candidates = _select_candidates(
        title=title,
        description=description,
        existing_complaints=existing_complaints,
    )

    if not candidates:
        return DuplicateDetectionResult(
            is_duplicate=False,
            similar_complaint_id=None,
            confidence=0.0,
            reason="No sufficiently similar existing complaints were found for comparison.",
        )

    complaints_text = "\n\n".join(
        [
            (
                f"Complaint ID: {complaint['id']}\n"
                f"Title: {complaint['title']}\n"
                f"Description: {complaint['description']}"
            )
            for complaint in candidates
        ]
    )

    prompt = f"""
You are a duplicate complaint detection assistant for a hostel
management system.

Determine whether the NEW complaint describes the same underlying
problem as any EXISTING complaint.

NEW COMPLAINT:

Title:
{title}

Description:
{description}

EXISTING COMPLAINTS:

{complaints_text}

Rules:

1. Mark is_duplicate=true only when the complaints clearly describe
   the same underlying issue.

2. Similar category alone is NOT enough.

3. Complaints about different physical problems are NOT duplicates.

4. If duplicate, return the ID of the most similar existing complaint.

5. Confidence must be between 0.0 and 1.0.

6. Keep the reason short and explain why the complaints are or are not
   duplicates.

Return only structured data matching the requested schema.
"""

    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_schema": DuplicateDetectionResult,
        },
    )

    return DuplicateDetectionResult.model_validate_json(
        response.text
    )
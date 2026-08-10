from google import genai
from pydantic import BaseModel

from app.core.config import settings
from app.enums.complaint_category import ComplaintCategory
from app.enums.complaint_priority import ComplaintPriority


class ComplaintClassification(BaseModel):
    category: ComplaintCategory
    priority: ComplaintPriority
    reason: str


client = genai.Client(
    api_key=settings.GEMINI_API_KEY
)


def classify_complaint(
    title: str,
    description: str,
) -> ComplaintClassification:

    prompt = f"""
You are a hostel complaint classification assistant.

Classify the following hostel complaint.

Title:
{title}

Description:
{description}

Choose the most appropriate category and priority.

Return only structured data matching the requested schema.
Do not invent information.

Category should represent the type of problem.
Priority should represent how urgently the hostel staff should handle it.
"""

    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_schema": ComplaintClassification,
        },
    )

    return ComplaintClassification.model_validate_json(
        response.text
    )
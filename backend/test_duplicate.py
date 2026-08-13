from app.services.duplicate_detection_service import detect_duplicate


existing_complaints = [
    {
        "id": "45d9a9fa-8c8d-4698-8620-49bc8d22eb55",
        "title": "Water leaking from ceiling",
        "description": (
            "Water is dripping continuously from the ceiling "
            "near the bathroom and making the floor wet."
        ),
    },
    {
        "id": "3bb87510-3a4d-41b3-8ffc-eae1c86fb7ca",
        "title": "Ceiling fan making strange noise",
        "description": (
            "The ceiling fan is making a loud rattling sound "
            "and sometimes stops suddenly."
        ),
    },
]


result = detect_duplicate(
    title="Bathroom ceiling water leak",
    description=(
        "Water is continuously leaking from the ceiling "
        "near the bathroom and making the floor wet."
    ),
    existing_complaints=existing_complaints,
)

print(result)
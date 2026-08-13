from app.enums.complaint_priority import ComplaintPriority


ESCALATED_PRIORITIES = {
    ComplaintPriority.URGENT,
    ComplaintPriority.HIGH,
}


def requires_escalation(priority: ComplaintPriority) -> bool:
    return priority in ESCALATED_PRIORITIES
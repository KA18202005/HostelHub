from enum import Enum

class ComplaintCategory(str, Enum):
    ELECTRICAL = "ELECTRICAL"
    PLUMBING = "PLUMBING"
    INTERNET = "INTERNET"
    CLEANING = "CLEANING"
    FURNITURE = "FURNITURE"
    WATER = "WATER"
    MESS = "MESS"
    OTHER = "OTHER"
from dataclasses import dataclass
from typing import Optional


@dataclass
class BusinessRecord:
    source_department: str
    source_id: str
    name: str
    address: str
    pincode: Optional[str]
    pan: Optional[str]
    gstin: Optional[str]
    owner_name: Optional[str]
    nic_code: Optional[str]


@dataclass
class LinkDecision:
    left_id: str
    right_id: str
    confidence: float
    decision: str
    reason: str

from __future__ import annotations

from app.tsunami.calculator import calculate_tsunami_hazard
from app.tsunami.schemas import TsunamiCalculationRequest, TsunamiCalculationResponse


class TsunamiService:

    def calculate(self, request: TsunamiCalculationRequest) -> TsunamiCalculationResponse:
        return TsunamiCalculationResponse.model_validate(calculate_tsunami_hazard(request))


tsunami_service = TsunamiService()


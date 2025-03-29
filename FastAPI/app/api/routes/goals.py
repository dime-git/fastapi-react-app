from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.goal import GoalCreate, GoalModel, GoalUpdate
from app.services.goal_service import GoalService

# Initialize router
goals_router = APIRouter(prefix="/goals", tags=["goals"])

@goals_router.post("", response_model=GoalModel)
async def create_goal(goal: GoalCreate):
    """Create a new financial goal"""
    try:
        created_goal = await GoalService.create(goal.dict())
        return created_goal
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create goal: {str(e)}")

@goals_router.get("", response_model=List[GoalModel])
async def get_goals(currency: Optional[str] = None):
    """Get all financial goals with optional currency conversion"""
    try:
        goals = await GoalService.get_all(target_currency=currency)
        return goals
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve goals: {str(e)}")

@goals_router.get("/{goal_id}", response_model=GoalModel)
async def get_goal(goal_id: str, currency: Optional[str] = None):
    """Get a financial goal by ID with optional currency conversion"""
    try:
        goal = await GoalService.get_by_id(goal_id, target_currency=currency)
        if not goal:
            raise HTTPException(status_code=404, detail=f"Goal with ID {goal_id} not found")
        return goal
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve goal: {str(e)}")

@goals_router.put("/{goal_id}", response_model=GoalModel)
async def update_goal(goal_id: str, goal_update: GoalUpdate):
    """Update a financial goal"""
    try:
        # Filter out None values
        update_data = {k: v for k, v in goal_update.dict().items() if v is not None}
        
        updated_goal = await GoalService.update(goal_id, update_data)
        if not updated_goal:
            raise HTTPException(status_code=404, detail=f"Goal with ID {goal_id} not found")
        return updated_goal
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update goal: {str(e)}")

@goals_router.delete("/{goal_id}")
async def delete_goal(goal_id: str):
    """Delete a financial goal"""
    try:
        deleted = await GoalService.delete(goal_id)
        if not deleted:
            raise HTTPException(status_code=404, detail=f"Goal with ID {goal_id} not found")
        return {"message": f"Goal with ID {goal_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete goal: {str(e)}")

@goals_router.post("/{goal_id}/contribute")
async def contribute_to_goal(goal_id: str, amount: float = Query(..., gt=0)):
    """Contribute an amount to a financial goal"""
    try:
        updated_goal = await GoalService.contribute(goal_id, amount)
        if not updated_goal:
            raise HTTPException(status_code=404, detail=f"Goal with ID {goal_id} not found")
        return updated_goal
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to contribute to goal: {str(e)}")

@goals_router.get("/category/{category}", response_model=List[GoalModel])
async def get_goals_by_category(category: str, currency: Optional[str] = None):
    """Get financial goals by category with optional currency conversion"""
    try:
        goals = await GoalService.get_by_category(category, target_currency=currency)
        return goals
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve goals by category: {str(e)}") 
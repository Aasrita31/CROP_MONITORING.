from fastapi import Depends, HTTPException, status
from app.auth.security import get_current_user
from app.models.user import User


def require_role(*allowed_roles: str):
    """
    Dependency factory that restricts access to users with specific roles.

    Usage:
        @router.get("/admin", dependencies=[Depends(require_role("admin"))])
        def admin_only(): ...
    """
    def role_checker(user: User = Depends(get_current_user)):
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(allowed_roles)}",
            )
        return user
    return role_checker

from qdrant_client.models import (
    Filter,
    FieldCondition,
    MatchValue,
    MatchAny
)


def metadata_filter(access_scope: str, team_id: str):

    if not access_scope:
        raise ValueError("role or access_scope not provided")

    if access_scope == "ADMIN_ONLY":
        return None

    if access_scope == "ALL_EMPLOYEES":
        return Filter(
            must=[
                FieldCondition(
                    key="metadata.access_scope",
                    match=MatchValue(value="ALL_EMPLOYEES")
                )
            ]
        )



    if access_scope == "TEAM_ONLY":
        return Filter(
            must=[
                FieldCondition(
                    key="metadata.team_id",
                    match=MatchValue(value=team_id)
                )
            ]
        )




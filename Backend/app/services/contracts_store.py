from app.config import settings


def contracts_collection(db):
    return db[settings.CONTRACTS_COLLECTION_NAME]


async def ensure_contract_indexes(db) -> None:
    contracts = contracts_collection(db)
    await contracts.create_index(
        [("user_id", 1), ("date", -1)],
        name="user_contracts_owner_date_idx",
    )
    await contracts.create_index(
        [("user_id", 1), ("analysis_status", 1)],
        name="user_contracts_owner_analysis_status_idx",
    )

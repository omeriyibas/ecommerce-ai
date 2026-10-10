from pydantic import BaseModel


class RetrievedPassage(BaseModel):
    content: str


class SearchResult(BaseModel):
    passages: list[RetrievedPassage]


class AssistantReply(BaseModel):
    answer: str

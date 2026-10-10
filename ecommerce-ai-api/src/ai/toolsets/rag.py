from pydantic_ai import FunctionToolset, RunContext

from ai.ai_schemas.rag import SearchResult
from ai.deps import AppDeps
from enums.document import DocumentType

rag_toolset = FunctionToolset[AppDeps](
    id="rag-search",
    instructions="Belge sorusunda search_documents; uygun document_type seç.",
)


@rag_toolset.tool
async def search_documents(
    ctx: RunContext[AppDeps],
    query: str,
    document_type: DocumentType,
) -> SearchResult:
    """Mağaza belgelerinde hybrid RAG ara (DB corpus)."""
    if ctx.deps.rag_index is None or ctx.deps.rag_service is None:
        return SearchResult(passages=[])

    print(f"\n[RAG araması]: {document_type} | {query}")
    return await ctx.deps.rag_service.search(
        ctx.deps.rag_index,
        query=query,
        document_type=document_type,
    )

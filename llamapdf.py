import nest_asyncio
import os
from dotenv import load_dotenv

load_dotenv()  # take environment variables from .env.
nest_asyncio.apply()

from llama_parse import LlamaParse
from llama_index import VectorStoreIndex, download_loader
from llama_index import SimpleDirectoryReader
from llama_index.embeddings import HuggingFaceEmbedding
from llama_index.ingestion import IngestionPipeline
from llama_index.storage.docstore import (
    SimpleDocumentStore,
    RedisDocumentStore,
    MongoDocumentStore,
)
from llama_index.text_splitter import SentenceSplitter


pipeline = IngestionPipeline(
    transformations=[
        SentenceSplitter(),
        HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5"),
    ],
    docstore=SimpleDocumentStore(),
)

# load documents with deterministic IDs
documentsRef = SimpleDirectoryReader("./documents", filename_as_id=True).load_data()
nodes = pipeline.run(documents=documentsRef)

for node in nodes:
    print(f"Node: {node.text}")


# print(os.environ)
# SimpleWebPageReader = download_loader("SimpleWebPageReader")

# loader = SimpleWebPageReader()

# parser = LlamaParse(
#     api_key=os.getenv("LLAMA_CLOUD_API_KEY"),
#     result_type="text",  # "markdown" and "text" are available
#     verbose=True
# )


# web_documents = loader.load_data(urls=['https://lamlicke.vercel.app'])
# index = VectorStoreIndex.from_documents(web_documents)
# response = index.query('classify what kind of website this is')
# print(response)
# # sync
# documents = parser.load_data("./documents/10-23-ag.pdf")
# print(documents[0].text[:100])
# async
# documents = await parser.aload_data("documents/10-23-ag.pdf")
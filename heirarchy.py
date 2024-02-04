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
from llama_index import ServiceContext
from llama_index.llms import OpenAI
from llama_index.schema import MetadataMode
from llama_index.text_splitter import SentenceSplitter
from llama_index import Document
from llama_index.node_parser import SemanticSplitterNodeParser
from llama_index.embeddings import OpenAIEmbedding
from llama_index.node_parser import HierarchicalNodeParser
from llama_index.node_parser import get_leaf_nodes, get_root_nodes
import openai

from llama_index.extractors import (
    SummaryExtractor,
    QuestionsAnsweredExtractor,
    TitleExtractor,
    KeywordExtractor,
    EntityExtractor,
    BaseExtractor,
)


import re
from llama_index.schema import TransformComponent


class TextCleaner(TransformComponent):
    def __call__(self, nodes, **kwargs):
        for node in nodes:
            node.text = re.sub(r"[^0-9A-Za-z ]", "", node.text)
        return nodes
    
llm = OpenAI(temperature=0.1, model="gpt-3.5-turbo", max_tokens=512)

parser = LlamaParse(
    
    result_type="text",  # "markdown" and "text" are available
    verbose=True
)

# sync
documents = parser.load_data("documents/10-23-ag.pdf")

embed_model = OpenAIEmbedding()
# embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
splitter = SemanticSplitterNodeParser(
    buffer_size=1, breakpoint_percentile_threshold=95, embed_model=embed_model
)
base_splitter = SentenceSplitter(chunk_size=512)
node_parser = HierarchicalNodeParser.from_defaults(
    chunk_sizes=[2048, 512, 128]
)# nodes = node_parser.get_nodes_from_documents(docs)

extractors = [
    TitleExtractor(nodes=5, llm=llm),
    QuestionsAnsweredExtractor(questions=3, llm=llm),
    # EntityExtractor(prediction_threshold=0.5),
    SummaryExtractor(summaries=["prev", "self"], llm=llm),
    # KeywordExtractor(keywords=10, llm=llm),
    EntityExtractor(
    prediction_threshold=0.5,
    label_entities=False,  # include the entity label in the metadata (can be erroneous)
    device="cpu",  # set to "cuda" if you have a GPU
    )
]

pipeline = IngestionPipeline(
    transformations=
        [TextCleaner(),splitter]+
        extractors
    ,
    docstore=SimpleDocumentStore(),
)

# load documents with deterministic IDs
# documentsRef = SimpleDirectoryReader("./documents", filename_as_id=True).load_data()
nodes = pipeline.run(documents=documents, num_workers=4)

for node in nodes:
    print(f"Node: {node.text, node.metadata}")


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
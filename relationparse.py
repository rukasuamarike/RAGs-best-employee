from llama_index.node_parser import (
    HierarchicalNodeParser,
    SentenceSplitter,
)
from dotenv import load_dotenv

load_dotenv() 
from llama_index import VectorStoreIndex, SimpleDirectoryReader

pipeline = IngestionPipeline(
    transformations=[
        SentenceSplitter(),
        HierarchicalNodeParser.from_defaults(),
        HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5"),
    ],
    docstore=SimpleDocumentStore(),
)

# load documents with deterministic IDs
documentsRef = SimpleDirectoryReader("./documents", filename_as_id=True).load_data()
nodes = pipeline.run(documents=documentsRef)

for node in nodes:
    print(f"Node: {node.text}")node_parser = HierarchicalNodeParser.from_defaults()
nodes = node_parser.get_nodes_from_documents(docs)
len(nodes)
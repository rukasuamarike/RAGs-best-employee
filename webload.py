from llama_index import SummaryIndex
from llama_index.readers import SimpleWebPageReader
from IPython.display import Markdown, display
import os
from dotenv import load_dotenv

load_dotenv()  # take environment variables from .env.
documents = SimpleWebPageReader(html_to_text=True).load_data(
    ["http://paulgraham.com/worked.html"]
)
print(documents[0].text)
index = SummaryIndex.from_documents(documents)
query_engine = index.as_query_engine()
response = query_engine.query("What did the author do growing up?")
display(response)

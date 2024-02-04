from llama_index import VectorStoreIndex, download_loader
import openai
from llama_index import SummaryIndex
from llama_index.readers import SimpleWebPageReader
from IPython.display import Markdown, display
import os
from dotenv import load_dotenv
from bs4 import BeautifulSoup
 

load_dotenv() 
SimpleWebPageReader = download_loader("SimpleWebPageReader")

# loader = SimpleWebPageReader()
# documents = loader.load_data(urls=['https://google.com'])
documents = SimpleWebPageReader(html_to_text=True).load_data(
    ["http://paulgraham.com/worked.html"]
)
index = SummaryIndex.from_documents(documents) 
# Calculating result
res = gfg.get_text()
 
# Printing the result
print(res)
# index = VectorStoreIndex.from_documents(documents)
# index.query('What language is on this website?')
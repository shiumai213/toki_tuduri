print("松下")

import requests

url = "http://127.0.0.1:5000/save"
data = {"text": "VS Codeから日記を保存してみた！"}

response = requests.post(url, json=data)

print("ステータスコード:", response.status_code)
print("レスポンス:", response.json())
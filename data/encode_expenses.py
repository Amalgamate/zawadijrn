import base64, sys, os

path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'expenses vote heads.xlsx')
with open(path, 'rb') as f:
    data = f.read()

b64 = base64.b64encode(data).decode('ascii')
output = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'expenses_b64.txt')
with open(output, 'w') as f:
    f.write(b64)
print(f"Written {len(b64)} chars to {output}")

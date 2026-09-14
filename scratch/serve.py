import socketserver
from http.server import SimpleHTTPRequestHandler

class ThreadingSimpleServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True

port = 3005
handler = SimpleHTTPRequestHandler
with ThreadingSimpleServer(('0.0.0.0', port), handler) as httpd:
    print(f"Threading server active on port {port}")
    httpd.serve_forever()

from flask import Flask, render_template, request, jsonify
from datetime import datetime
import sqlite3
import os

app = Flask(__name__)
DB = "touchlog.db"

def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS visitas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                motivo TEXT NOT NULL,
                comentario TEXT,
                fecha TEXT NOT NULL,
                hora TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/visitas", methods=["GET"])
def get_visitas():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM visitas ORDER BY created_at DESC LIMIT 50"
        ).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/api/visitas", methods=["POST"])
def create_visita():
    data = request.get_json()
    nombre = data.get("nombre", "").strip()
    motivo = data.get("motivo", "").strip()
    comentario = data.get("comentario", "").strip()

    if not nombre or not motivo:
        return jsonify({"error": "Nombre y motivo son requeridos"}), 400

    now = datetime.now()
    fecha = now.strftime("%d/%m/%Y")
    hora = now.strftime("%H:%M:%S")

    with get_db() as conn:
        cursor = conn.execute(
            "INSERT INTO visitas (nombre, motivo, comentario, fecha, hora) VALUES (?, ?, ?, ?, ?)",
            (nombre, motivo, comentario, fecha, hora)
        )
        conn.commit()
        new_id = cursor.lastrowid

    return jsonify({
        "id": new_id,
        "nombre": nombre,
        "motivo": motivo,
        "comentario": comentario,
        "fecha": fecha,
        "hora": hora
    }), 201

@app.route("/api/visitas/<int:visita_id>", methods=["DELETE"])
def delete_visita(visita_id):
    with get_db() as conn:
        conn.execute("DELETE FROM visitas WHERE id = ?", (visita_id,))
        conn.commit()
    return jsonify({"ok": True})

if __name__ == "__main__":
    # init_db()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

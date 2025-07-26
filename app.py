from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import asc

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///todo.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Модель задачи
class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(200), nullable=False)
    completed = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {'id': self.id, 'text': self.text, 'completed': self.completed}

@app.route('/')
def index():
    return render_template('index.html')

# API получить все задачи
@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    tasks = Task.query.order_by(asc(Task.id)).all()
    return jsonify([task.to_dict() for task in tasks])

# API добавить задачу
@app.route('/api/tasks', methods=['POST'])
def add_task():
    data = request.json
    text = data.get('text', '').strip()
    if not text:
        return jsonify({'error': 'Текст задачи не может быть пустым'}), 400
    task = Task(text=text)
    db.session.add(task)
    db.session.commit()
    return jsonify(task.to_dict()), 201

# API обновить задачу (текст и/или статус)
@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.json
    if 'text' in data:
        text = data['text'].strip()
        if not text:
            return jsonify({'error': 'Текст задачи не может быть пустым'}), 400
        task.text = text
    if 'completed' in data:
        task.completed = bool(data['completed'])
    db.session.commit()
    return jsonify(task.to_dict())

# API удалить задачу
@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return jsonify({'result': 'ok'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Создаст таблицы при первом запуске
    app.run(debug=True)

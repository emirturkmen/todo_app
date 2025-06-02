import { useState, useEffect, useRef } from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import React from "react";
import { useAuth } from "../context/AuthContext";
import "./Todo.css";

function Todo() {
  const { token, logout } = useAuth();
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  // Store refs for each todo item
  const nodeRefs = useRef({});

  useEffect(() => {
    fetchTodos();
    // eslint-disable-next-line
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setTodos(data);
      } else {
        setTodos([]);
        if (response.status === 401 || response.status === 403) {
          logout();
        }
      }
    } catch (error) {
      console.error("Error fetching todos:", error);
      setTodos([]);
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      const response = await fetch("http://localhost:3001/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTodo }),
      });
      const data = await response.json();
      setTodos((prev) => (Array.isArray(prev) ? [...prev, data] : [data]));
      setNewTodo("");
    } catch (error) {
      console.error("Error adding todo:", error);
    }
  };

  const toggleTodo = async (id, completed) => {
    try {
      const todo = todos.find((t) => t.id === id);
      const response = await fetch(`http://localhost:3001/api/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: todo.title,
          completed: !completed,
        }),
      });
      const updatedTodo = await response.json();
      setTodos((prev) =>
        Array.isArray(prev)
          ? prev.map((t) => (t.id === id ? updatedTodo : t))
          : []
      );
    } catch (error) {
      console.error("Error updating todo:", error);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await fetch(`http://localhost:3001/api/tasks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setTodos((prev) =>
        Array.isArray(prev) ? prev.filter((t) => t.id !== id) : []
      );
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  return (
    <div className="todo-container">
      <h1>Todo List</h1>
      <form onSubmit={addTodo} className="todo-form">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new todo..."
          className="todo-input"
        />
        <button type="submit" className="add-button">
          Add
        </button>
      </form>
      <TransitionGroup component="ul" className="todo-list">
        {(Array.isArray(todos) ? todos : []).map((todo) => {
          // Create or reuse a ref for each todo item using React.createRef()
          if (!nodeRefs.current[todo.id]) {
            nodeRefs.current[todo.id] = React.createRef();
          }
          return (
            <CSSTransition
              key={todo.id}
              timeout={350}
              classNames="todo-item-anim"
              nodeRef={nodeRefs.current[todo.id]}
            >
              <li ref={nodeRefs.current[todo.id]} className="todo-item">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id, todo.completed)}
                  className="todo-checkbox"
                />
                <span
                  className={`todo-text${todo.completed ? " completed" : ""}`}
                >
                  {todo.title}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="delete-button"
                >
                  Delete
                </button>
              </li>
            </CSSTransition>
          );
        })}
      </TransitionGroup>
    </div>
  );
}

export default Todo;

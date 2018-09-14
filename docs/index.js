// function createStore(reducer) {
//   // The store should have 4 parts
//   // 1. The state
//   // 2. Get the state
//   // 3. Listen to changes on the state
//   // 4. Update the state

//   let state;
//   let listeners = [];

//   const getState = () => state;

//   const subscribe = listener => {
//     listeners.push(listener);
//     return () => {
//       listeners = listeners.filter(l => l !== listener);
//     };
//   };

//   const dispatch = action => {
//     // call todosReducer
//     state = reducer(state, action);
//     // loop over listeners and invoke them
//     listeners.forEach(listener => listener());
//   };

//   return {
//     getState,
//     subscribe,
//     dispatch
//   };
// }

// Constants
const ADD_TODO = "ADD_TODO";
const REMOVE_TODO = "REMOVE_TODO";
const TOGGLE_TODO = "TOGGLE_TODO";
const ADD_GOAL = "ADD_GOAL";
const REMOVE_GOAL = "REMOVE_GOAL";
const RECEIVE_DATA = "RECEIVE_DATA";

// Actions
const receiveDataAction = (todos, goals) => ({
  type: RECEIVE_DATA,
  todos,
  goals
});

const addTodoAction = todo => ({
  type: ADD_TODO,
  todo
});

const removeTodoAction = id => ({
  type: REMOVE_TODO,
  id
});

const toggleTodoAction = id => ({
  type: TOGGLE_TODO,
  id
});

const addGoalAction = goal => ({
  type: ADD_GOAL,
  goal
});

const removeGoalAction = id => ({
  type: REMOVE_GOAL,
  id
});

const checkAndDispatch = (state, action) => {
  if (action.type === ADD_TODO && action.todo.name.indexOf("sleep") !== -1) {
    return alert("No sleep is allowed now!");
  }
  state.dispatch(action);
};

// async Actions

const handleRemoveTodoAction = item => {
  return dispatch => {
    dispatch(removeTodoAction(item.id));
    return API.deleteTodo(item.id)
      .then(todos => console.log("todos now: ", todos))
      .catch(e => {
        dispatch(addTodoAction(item));
        alert("Can not remove the todo!");
      });
  };
};

const handleToggleTodoAction = id => {
  return dispatch => {
    dispatch(toggleTodoAction(id));
    return API.saveTodoToggle(id).catch(() => {
      dispatch(toggleTodoAction(id));
      alert("Toggle unsuccessful!");
    });
  };
};

const handleAddTodoAction = (text, cb) => {
  return dispatch => {
    return API.saveTodo(text)
      .then(todo => {
        dispatch(addTodoAction(todo));
        cb();
      })
      .catch(e => alert("Can not add the new Todo!"));
  };
};

const handleRemoveGoalAction = goal => {
  return dispatch => {
    dispatch(removeGoalAction(goal.id));
    API.deleteGoal(goal.id).catch(e => {
      dispatch(addGoalAction(goal));
      alert("Can not remove the goal!");
    });
  };
};

const handleAddGoalAction = (name, cb) => {
  API.saveGoal(name)
    .then(goal => {
      dispatch(addGoalAction(goal));
      cb();
    })
    .catch(e => alert("Can not add the new goal!"));
};

const handleReceiveDataAction = () => {
  return dispatch => {
    Promise.all([API.fetchTodos(), API.fetchGoals()]).then(([todos, goals]) => {
      dispatch(receiveDataAction(todos, goals));
    });
  };
};

// Reducers

function todosReducer(state = [], action) {
  if (action.type === ADD_TODO) {
    return state.concat(action.todo);
  } else if (action.type === REMOVE_TODO) {
    return state.filter(todo => todo.id !== action.id);
  } else if (action.type === TOGGLE_TODO) {
    return state.map(
      todo =>
        todo.id === action.id ? { ...todo, complete: !todo.complete } : todo
    );
  } else if (action.type === RECEIVE_DATA) {
    return action.todos;
  } else {
    return state;
  }
}

function goalsReducer(state = [], action) {
  switch (action.type) {
    case ADD_GOAL:
      return state.concat(action.goal);
    case REMOVE_GOAL:
      return state.filter(goal => goal.id !== action.id);
    case RECEIVE_DATA:
      return action.goals;
    default:
      return state;
  }
}

function loadingReducer(state = true, action) {
  switch (action.type) {
    case RECEIVE_DATA:
      return false;
    default:
      return state;
  }
}

function combineReducers(reducersObject) {
  return function(state = {}, action) {
    const newState = {};
    Object.keys(reducersObject).forEach(reducerName => {
      newState[reducerName] = reducersObject[reducerName](
        state[reducerName],
        action
      );
    });
    return newState;
  };
}

// Middleware

const checker = store => next => action => {
  if (action.type === ADD_TODO && action.todo.name.indexOf("sleep") !== -1) {
    return alert("No sleep is allowed now!");
  }
  return next(action);
};

const logger = store => next => action => {
  console.group(action.type);
  console.log("The action: ", action);
  const result = next(action);
  console.log("The new state: ", store.getState());
  console.groupEnd();
  return result;
};

const thunk = store => next => action => {
  if (typeof action === "function") {
    return action(store.dispatch);
  } else if (typeof action === "object") {
    return next(action);
  }
};

// Start point
const myStore = Redux.createStore(
  Redux.combineReducers({
    todos: todosReducer,
    goals: goalsReducer,
    loading: loadingReducer
  }),
  Redux.applyMiddleware(thunk, checker, logger)
);

// Selectors
const todoList = document.querySelector("#todos");
const goalList = document.querySelector("#goals");
const addTodo = document.querySelector("#addTodo");
const addGoal = document.querySelector("#addGoal");
const todoInput = document.querySelector("#todoInput");
const goalInput = document.querySelector("#goalInput");

// update UI when state changes
myStore.subscribe(() => {
  updateTodoListUI();
  updateGoalListUI();
});

// Event Listeners

addTodo.addEventListener("click", addTodoListener);
addGoal.addEventListener("click", addGoalListener);

function addGoalListener() {
  const name = goalInput.value;
  myStore.dispatch(
    addGoalAction({
      id: makeid(),
      name
    })
  );
  goalInput.value = "";
}

function addTodoListener() {
  const name = todoInput.value;
  myStore.dispatch(
    addTodoAction({
      id: makeid(),
      name,
      complete: false
    })
  );
  // checkAndDispatch(
  //   myStore,
  //   addTodoAction({
  //     id: makeid(),
  //     name,
  //     complete: false
  //   })
  // );
  todoInput.value = "";
}

// Utilities
function makeid() {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function updateTodoListUI() {
  todoList.innerHTML = "";
  myStore.getState().todos.forEach(todo => {
    const todoEle = document.createElement("li");
    todoEle.textContent = todo.name;
    todoEle.addEventListener("click", function(e) {
      console.log("event from li: ", e.target.nodeName);
      if (e.target.nodeName === "LI") {
        myStore.dispatch(toggleTodoAction(todo.id));
      }
    });

    todoEle.appendChild(
      createRemoveButton(e => {
        console.log("event from btn: ", e.target.nodeName);
        if (e.target.nodeName === "BUTTON") {
          myStore.dispatch(removeTodoAction(todo.id));
        }
      })
    );

    if (todo.complete) todoEle.style.textDecoration = "line-through";
    todoList.appendChild(todoEle);
  });
}

function updateGoalListUI() {
  goalList.innerHTML = "";
  myStore.getState().goals.forEach(goal => {
    const goalEle = document.createElement("li");
    goalEle.textContent = goal.name;
    goalEle.appendChild(
      createRemoveButton(() => {
        myStore.dispatch(removeGoalAction(goal.id));
      })
    );
    goalList.appendChild(goalEle);
  });
}

// Create remove button
function createRemoveButton(handler) {
  const btn = document.createElement("button");
  btn.innerHTML = "X";
  btn.addEventListener("click", handler);
  return btn;
}

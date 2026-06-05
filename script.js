import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================
   FIREBASE CONFIG
========================= */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

/* =========================
   GLOBAL TASK ARRAY
========================= */

let tasks = [];

/* =========================
   AUTH
========================= */

window.signup = async () => {

  const email =
    document.getElementById("email").value;

  const password =
    document.getElementById("password").value;

  try {

    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    alert("Signup Successful");

  } catch (error) {

    alert(error.message);

  }

};

window.login = async () => {

  const email =
    document.getElementById("email").value;

  const password =
    document.getElementById("password").value;

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    alert("Login Successful");

  } catch (error) {

    alert(error.message);

  }

};

onAuthStateChanged(auth, user => {

  if (user) {

    loadTasks();

  }

});

/* =========================
   ADD TASK
========================= */

window.addTask = async () => {

  const text =
    document.getElementById("taskInput").value;

  const dueDate =
    document.getElementById("dueDate").value;

  const category =
    document.getElementById("category").value;

  const priority =
    document.getElementById("priority").value;

  if (text.trim() === "") {

    alert("Enter Task");
    return;

  }

  try {

    await addDoc(
      collection(db, "tasks"),
      {
        text,
        dueDate,
        category,
        priority,
        completed: false,
        createdAt: Date.now()
      }
    );

    document.getElementById(
      "taskInput"
    ).value = "";

    loadTasks();

  } catch (error) {

    alert(error.message);

  }

};

/* =========================
   LOAD TASKS
========================= */

async function loadTasks() {

  tasks = [];

  const querySnapshot =
    await getDocs(
      collection(db, "tasks")
    );

  querySnapshot.forEach(docItem => {

    tasks.push({
      id: docItem.id,
      ...docItem.data()
    });

  });

  renderTasks();

}

/* =========================
   DELETE TASK
========================= */

window.deleteTask =
async function(id) {

  await deleteDoc(
    doc(db, "tasks", id)
  );

  loadTasks();

};

/* =========================
   COMPLETE TASK
========================= */

window.toggleComplete =
async function(id, currentValue) {

  await updateDoc(
    doc(db, "tasks", id),
    {
      completed: !currentValue
    }
  );

  loadTasks();

};

/* =========================
   EDIT TASK
========================= */

window.editTask =
async function(id, oldText) {

  const newText =
    prompt(
      "Edit Task",
      oldText
    );

  if (!newText) return;

  await updateDoc(
    doc(db, "tasks", id),
    {
      text: newText
    }
  );

  loadTasks();

};

/* =========================
   SEARCH + RENDER
========================= */

window.renderTasks = function() {

  const searchText =
    document.getElementById("search")
    .value
    .toLowerCase();

  const taskList =
    document.getElementById("taskList");

  taskList.innerHTML = "";

  const filteredTasks =
    tasks.filter(task =>
      task.text
      .toLowerCase()
      .includes(searchText)
    );

  filteredTasks.forEach(task => {

    const li =
      document.createElement("li");

    li.draggable = true;

    li.innerHTML = `

      <div class="task-info">

      <h3 class="${
        task.completed
          ? "completed"
          : ""
      }">

      ${task.text}

      </h3>

      <p>
      📅 ${task.dueDate || "No Date"}
      </p>

      <p>
      🏷️ ${task.category}
      </p>

      <p>
      ⚡ ${task.priority}
      </p>

      </div>

      <div class="actions">

      <button
      class="complete-btn"
      onclick="
      toggleComplete(
      '${task.id}',
      ${task.completed}
      )">

      ${
        task.completed
        ? "Undo"
        : "Done"
      }

      </button>

      <button
      class="edit-btn"
      onclick="
      editTask(
      '${task.id}',
      '${task.text}'
      )">

      Edit

      </button>

      <button
      class="delete-btn"
      onclick="
      deleteTask(
      '${task.id}'
      )">

      Delete

      </button>

      </div>

    `;

    taskList.appendChild(li);

  });

  updateStats();
  updateProgress();

};

/* =========================
   STATS
========================= */

function updateStats() {

  const total =
    tasks.length;

  const completed =
    tasks.filter(
      task =>
      task.completed
    ).length;

  const pending =
    total - completed;

  document.getElementById(
    "totalTasks"
  ).innerText = total;

  document.getElementById(
    "completedTasks"
  ).innerText = completed;

  document.getElementById(
    "pendingTasks"
  ).innerText = pending;

}

/* =========================
   PROGRESS BAR
========================= */

function updateProgress() {

  const completed =
    tasks.filter(
      task =>
      task.completed
    ).length;

  const total =
    tasks.length;

  let percent = 0;

  if (total > 0) {

    percent =
      (completed / total) * 100;

  }

  document.getElementById(
    "progressBar"
  ).style.width =
  percent + "%";

  document.getElementById(
    "progressText"
  ).innerText =

  `${completed}/${total}
   Tasks Completed`;

}

/* =========================
   PDF EXPORT
========================= */

window.downloadPDF =
function() {

  const { jsPDF } =
    window.jspdf;

  const pdf =
    new jsPDF();

  let y = 20;

  pdf.text(
    "Smart Task Manager",
    20,
    10
  );

  tasks.forEach(task => {

    pdf.text(

      `${task.text}
       | ${task.priority}
       | ${task.category}
       | ${task.dueDate}`,

      10,
      y

    );

    y += 10;

  });

  pdf.save(
    "SmartTaskManager.pdf"
  );

};

/* =========================
   DARK MODE
========================= */

const themeBtn =
document.getElementById(
  "themeBtn"
);

if (
localStorage.getItem(
"darkMode"
) === "true"
) {

document.body.classList.add(
"dark"
);

}

themeBtn.addEventListener(
"click",
() => {

document.body.classList.toggle(
"dark"
);

localStorage.setItem(

"darkMode",

document.body.classList.contains(
"dark"
)

);

}
);